import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventsPublisher } from '../messaging/events.publisher';
import { NotificationEvent } from '@app/contracts';
import { IdentityClient } from '../identity-client/identity.client';
import { TasksService } from '../tasks/tasks.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectInvitation,
  ProjectInvitationDocument,
} from './schemas/project-invitation.schema';
import { Project, ProjectDocument } from './schemas/project.schema';
import { ProjectInvitationStatus } from './types/project-invitation-status.enum';
import { ProjectRole } from './types/project-role.enum';

const MONGO_DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectInvitation.name)
    private readonly invitationModel: Model<ProjectInvitationDocument>,
    private readonly identity: IdentityClient,
    @Inject(forwardRef(() => TasksService))
    private readonly tasks: TasksService,
    private readonly events: EventsPublisher,
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: Types.ObjectId,
  ): Promise<ProjectDocument> {
    const now = new Date();
    return this.projectModel.create({
      title: dto.title,
      description: dto.description,
      owner: userId,
      members: [
        {
          user: userId,
          role: ProjectRole.OWNER,
          joinedAt: now,
        },
      ],
    });
  }

  async listForUser(userId: Types.ObjectId): Promise<
    Array<{
      project: ProjectDocument;
      role: ProjectRole;
    }>
  > {
    const projects = await this.projectModel
      .find({ 'members.user': userId })
      .sort({ createdAt: -1 })
      .exec();

    return projects.map((project) => {
      const membership = project.members.find((m) => m.user.equals(userId));
      return {
        project,
        role: membership!.role,
      };
    });
  }

  async findByIdForUser(
    projectId: string,
    userId: Types.ObjectId,
  ): Promise<ProjectDocument> {
    const project = await this.loadProject(projectId);
    this.requireMember(project, userId);
    return project;
  }

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    userId: Types.ObjectId,
  ): Promise<ProjectDocument> {
    const project = await this.loadProject(projectId);
    this.requireOwner(project, userId);

    if (dto.title !== undefined) project.title = dto.title;
    if (dto.description !== undefined) project.description = dto.description;

    await project.save();
    return project;
  }

  async remove(projectId: string, userId: Types.ObjectId): Promise<void> {
    const project = await this.loadProject(projectId);
    this.requireOwner(project, userId);

    await this.invitationModel.deleteMany({ project: project._id }).exec();
    await this.tasks.deleteAllForProject(project._id);
    await this.projectModel.deleteOne({ _id: project._id }).exec();
  }

  async leave(projectId: string, userId: Types.ObjectId): Promise<void> {
    const project = await this.loadProject(projectId);
    this.requireMember(project, userId);

    if (project.owner.equals(userId)) {
      throw new BadRequestException(
        'Owner cannot leave the project; delete the project instead',
      );
    }

    project.members = project.members.filter((m) => !m.user.equals(userId));
    await this.tasks.unassignUserFromProjectTasks(project._id, userId);
    await project.save();
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    actingUserId: Types.ObjectId,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new NotFoundException('Member not found');
    }
    const target = new Types.ObjectId(targetUserId);

    const project = await this.loadProject(projectId);
    this.requireOwner(project, actingUserId);

    if (project.owner.equals(target)) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    const before = project.members.length;
    project.members = project.members.filter((m) => !m.user.equals(target));
    if (project.members.length === before) {
      throw new NotFoundException('Member not found');
    }

    await this.tasks.unassignUserFromProjectTasks(project._id, target);
    await project.save();

    this.events.publish(NotificationEvent.ProjectMemberRemoved, {
      projectId: project.id,
      projectTitle: project.title,
      removedUserId: target.toString(),
      actorId: actingUserId.toString(),
    });
  }

  async createInvitation(
    projectId: string,
    email: string,
    inviterId: Types.ObjectId,
  ): Promise<ProjectInvitationDocument> {
    const project = await this.loadProject(projectId);
    this.requireOwner(project, inviterId);

    const invitee = await this.identity.findByEmail(email);
    if (!invitee) {
      throw new NotFoundException('No registered user with that email');
    }

    const inviteeId = new Types.ObjectId(invitee.id);
    if (project.members.some((m) => m.user.equals(inviteeId))) {
      throw new ConflictException('User is already a member of this project');
    }

    let invitation: ProjectInvitationDocument;
    try {
      invitation = await this.invitationModel.create({
        project: project._id,
        invitee: inviteeId,
        inviter: inviterId,
        status: ProjectInvitationStatus.PENDING,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        (err as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR
      ) {
        throw new ConflictException(
          'A pending invitation already exists for this user',
        );
      }
      throw err;
    }

    this.events.publish(NotificationEvent.ProjectInvitationCreated, {
      invitationId: invitation.id,
      projectId: project.id,
      projectTitle: project.title,
      inviteeId: inviteeId.toString(),
      inviterId: inviterId.toString(),
      actorId: inviterId.toString(),
    });

    return invitation;
  }

  async listInvitations(
    projectId: string,
    userId: Types.ObjectId,
  ): Promise<Record<string, unknown>[]> {
    const project = await this.loadProject(projectId);
    this.requireOwner(project, userId);

    const invitations = await this.invitationModel
      .find({ project: project._id })
      .sort({ createdAt: -1 })
      .exec();

    return this.hydrateInvitations(invitations, ['invitee', 'inviter']);
  }

  async revokeInvitation(
    projectId: string,
    invitationId: string,
    userId: Types.ObjectId,
  ): Promise<ProjectInvitationDocument> {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new NotFoundException('Invitation not found');
    }

    const project = await this.loadProject(projectId);
    this.requireOwner(project, userId);

    const invitation = await this.invitationModel
      .findOne({ _id: invitationId, project: project._id })
      .exec();
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation cannot be revoked (status: ${invitation.status})`,
      );
    }

    invitation.status = ProjectInvitationStatus.REVOKED;
    await invitation.save();
    return invitation;
  }

  async listMyPendingInvitations(
    userId: Types.ObjectId,
  ): Promise<Record<string, unknown>[]> {
    const invitations = await this.invitationModel
      .find({ invitee: userId, status: ProjectInvitationStatus.PENDING })
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .exec();

    return this.hydrateInvitations(invitations, ['inviter']);
  }

  /**
   * Replaces the cross-DB `.populate()` of user refs: collects the invitee/
   * inviter ObjectIds, resolves them via Identity's internal API, and returns
   * plain objects with those fields swapped for the user summary — preserving
   * the previous populated wire shape. Unknown ids keep their raw id string.
   */
  private async hydrateInvitations(
    invitations: ProjectInvitationDocument[],
    fields: Array<'invitee' | 'inviter'>,
  ): Promise<Record<string, unknown>[]> {
    const ids = new Set<string>();
    for (const inv of invitations) {
      for (const field of fields) {
        const oid = field === 'invitee' ? inv.invitee : inv.inviter;
        if (oid) ids.add(oid.toString());
      }
    }

    const summaries = ids.size ? await this.identity.findByIds([...ids]) : [];
    const byId = new Map(
      summaries.map((u) => [u.id, u] as [string, (typeof summaries)[number]]),
    );

    return invitations.map((inv) => {
      const obj = inv.toJSON() as unknown as Record<string, unknown>;
      for (const field of fields) {
        const oid = field === 'invitee' ? inv.invitee : inv.inviter;
        const summary = oid ? byId.get(oid.toString()) : undefined;
        if (summary) obj[field] = summary;
      }
      return obj;
    });
  }

  async acceptMyInvitation(
    invitationId: string,
    userId: Types.ObjectId,
  ): Promise<ProjectInvitationDocument> {
    const invitation = await this.loadMyPendingInvitation(invitationId, userId);

    const project = await this.projectModel.findById(invitation.project).exec();
    if (!project) {
      invitation.status = ProjectInvitationStatus.REVOKED;
      await invitation.save();
      throw new NotFoundException('Project no longer exists');
    }

    let memberAdded = false;
    if (!project.members.some((m) => m.user.equals(userId))) {
      project.members.push({
        user: userId,
        role: ProjectRole.MEMBER,
        joinedAt: new Date(),
      });
      await project.save();
      memberAdded = true;
    }

    invitation.status = ProjectInvitationStatus.ACCEPTED;
    await invitation.save();

    if (memberAdded) {
      this.events.publish(NotificationEvent.ProjectMemberAdded, {
        projectId: project.id,
        projectTitle: project.title,
        memberId: userId.toString(),
        ownerId: project.owner.toString(),
        actorId: userId.toString(),
      });
    }

    return invitation;
  }

  async declineMyInvitation(
    invitationId: string,
    userId: Types.ObjectId,
  ): Promise<ProjectInvitationDocument> {
    const invitation = await this.loadMyPendingInvitation(invitationId, userId);
    invitation.status = ProjectInvitationStatus.DECLINED;
    await invitation.save();
    return invitation;
  }

  async assertMember(
    projectId: string,
    userId: Types.ObjectId,
    requiredRole?: ProjectRole,
  ): Promise<ProjectDocument> {
    const project = await this.loadProject(projectId);
    const membership = project.members.find((m) => m.user.equals(userId));
    if (!membership) {
      throw new ForbiddenException('Not a member of this project');
    }
    if (requiredRole && membership.role !== requiredRole) {
      throw new ForbiddenException(
        `Requires ${requiredRole} role in this project`,
      );
    }
    return project;
  }

  private async loadProject(projectId: string): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private requireMember(
    project: ProjectDocument,
    userId: Types.ObjectId,
  ): void {
    if (!project.members.some((m) => m.user.equals(userId))) {
      throw new ForbiddenException('Not a member of this project');
    }
  }

  private requireOwner(project: ProjectDocument, userId: Types.ObjectId): void {
    if (!project.owner.equals(userId)) {
      throw new ForbiddenException('Only the project owner can do that');
    }
  }

  private async loadMyPendingInvitation(
    invitationId: string,
    userId: Types.ObjectId,
  ): Promise<ProjectInvitationDocument> {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new NotFoundException('Invitation not found');
    }
    const invitation = await this.invitationModel.findById(invitationId).exec();
    if (!invitation || !invitation.invitee.equals(userId)) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is no longer pending (status: ${invitation.status})`,
      );
    }
    return invitation;
  }
}
