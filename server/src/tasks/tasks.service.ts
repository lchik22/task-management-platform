import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListMyTasksQueryDto } from './dto/list-my-tasks-query.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,
  ) {}

  async create(
    projectId: string,
    dto: CreateTaskDto,
    userId: Types.ObjectId,
  ): Promise<TaskDocument> {
    const project = await this.projects.assertMember(projectId, userId);

    let assignee: Types.ObjectId | null = null;
    if (dto.assignee) {
      assignee = this.requireAssigneeIsMember(project, dto.assignee);
    }

    return this.taskModel.create({
      project: project._id,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      assignee,
      creator: userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
  }

  async listForProject(
    projectId: string,
    query: ListTasksQueryDto,
    userId: Types.ObjectId,
  ): Promise<TaskDocument[]> {
    const project = await this.projects.assertMember(projectId, userId);

    const filter: Record<string, unknown> = { project: project._id };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignee !== undefined) {
      filter.assignee = this.resolveAssigneeFilter(query.assignee, userId);
    }

    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(
    projectId: string,
    taskId: string,
    userId: Types.ObjectId,
  ): Promise<TaskDocument> {
    await this.projects.assertMember(projectId, userId);
    return this.loadTask(projectId, taskId);
  }

  async update(
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: Types.ObjectId,
  ): Promise<TaskDocument> {
    const project = await this.projects.assertMember(projectId, userId);
    const task = await this.loadTask(projectId, taskId);
    this.requireWriteAccess(task, project, userId);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assignee !== undefined) {
      task.assignee =
        dto.assignee === null
          ? null
          : this.requireAssigneeIsMember(project, dto.assignee);
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    await task.save();
    return task;
  }

  async updateStatus(
    projectId: string,
    taskId: string,
    dto: UpdateTaskStatusDto,
    userId: Types.ObjectId,
  ): Promise<TaskDocument> {
    const project = await this.projects.assertMember(projectId, userId);
    const task = await this.loadTask(projectId, taskId);
    this.requireStatusAccess(task, project, userId);

    task.status = dto.status;
    await task.save();
    return task;
  }

  async remove(
    projectId: string,
    taskId: string,
    userId: Types.ObjectId,
  ): Promise<void> {
    const project = await this.projects.assertMember(projectId, userId);
    const task = await this.loadTask(projectId, taskId);
    this.requireWriteAccess(task, project, userId);

    await this.taskModel.deleteOne({ _id: task._id }).exec();
  }

  listMine(
    userId: Types.ObjectId,
    query: ListMyTasksQueryDto,
  ): Promise<TaskDocument[]> {
    const filter: Record<string, unknown> = { assignee: userId };
    if (query.status) filter.status = query.status;
    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async deleteAllForProject(projectId: Types.ObjectId): Promise<void> {
    await this.taskModel.deleteMany({ project: projectId }).exec();
  }

  async unassignUserFromProjectTasks(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    await this.taskModel
      .updateMany(
        { project: projectId, assignee: userId },
        { $set: { assignee: null } },
      )
      .exec();
  }

  private async loadTask(
    projectId: string,
    taskId: string,
  ): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException('Task not found');
    }
    const task = await this.taskModel
      .findOne({ _id: taskId, project: projectId })
      .exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private requireWriteAccess(
    task: TaskDocument,
    project: ProjectDocument,
    userId: Types.ObjectId,
  ): void {
    if (project.owner.equals(userId) || task.creator.equals(userId)) {
      return;
    }
    throw new ForbiddenException(
      'Only the task creator or the project owner can do that',
    );
  }

  private requireStatusAccess(
    task: TaskDocument,
    project: ProjectDocument,
    userId: Types.ObjectId,
  ): void {
    if (project.owner.equals(userId) || task.creator.equals(userId)) {
      return;
    }
    if (task.assignee && task.assignee.equals(userId)) {
      return;
    }
    throw new ForbiddenException(
      'Only the task creator, assignee, or project owner can change status',
    );
  }

  private requireAssigneeIsMember(
    project: ProjectDocument,
    assigneeId: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(assigneeId)) {
      throw new BadRequestException('Assignee must be a project member');
    }
    const oid = new Types.ObjectId(assigneeId);
    const isMember = project.members.some((m) => m.user.equals(oid));
    if (!isMember) {
      throw new BadRequestException('Assignee must be a project member');
    }
    return oid;
  }

  private resolveAssigneeFilter(
    value: string,
    userId: Types.ObjectId,
  ): Types.ObjectId | null {
    if (value === 'me') return userId;
    if (value === 'unassigned') return null;
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'assignee must be a user id, "me", or "unassigned"',
      );
    }
    return new Types.ObjectId(value);
  }
}
