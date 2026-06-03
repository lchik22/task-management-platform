import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { Invitation, InvitationDocument } from './schemas/invitation.schema';
import { InvitationStatus } from './types/invitation-status.enum';

const INVITATION_TTL_DAYS = 7;
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;
const MONGO_DUPLICATE_KEY_ERROR = 11000;

export interface CreatedInvitation {
  invitation: InvitationDocument;
  rawToken: string;
  expiresAt: Date;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<InvitationDocument>,
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  async create(
    email: string,
    invitedBy: Types.ObjectId,
  ): Promise<InvitationDocument> {
    const normalized = email.toLowerCase();

    if (await this.users.existsByEmail(normalized)) {
      throw new ConflictException('Email already registered');
    }

    const now = new Date();
    const existing = await this.invitationModel
      .findOne({
        email: normalized,
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: now },
      })
      .exec();
    if (existing) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    let invitation: InvitationDocument;
    try {
      invitation = await this.invitationModel.create({
        email: normalized,
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedBy,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        (err as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR
      ) {
        throw new ConflictException(
          'A pending invitation already exists for this email',
        );
      }
      throw err;
    }

    await this.mail.sendInvitation(normalized, rawToken, expiresAt);

    return invitation;
  }

  list(): Promise<InvitationDocument[]> {
    return this.invitationModel.find().sort({ createdAt: -1 }).exec();
  }

  async revoke(id: string): Promise<InvitationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invitation not found');
    }

    const invitation = await this.invitationModel.findById(id).exec();
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        `Invitation cannot be revoked (status: ${invitation.status})`,
      );
    }

    invitation.status = InvitationStatus.REVOKED;
    invitation.revokedAt = new Date();
    await invitation.save();
    return invitation;
  }

  async consume(rawToken: string): Promise<InvitationDocument> {
    const tokenHash = this.hashToken(rawToken);
    const invitation = await this.invitationModel
      .findOne({ tokenHash })
      .select('+tokenHash')
      .exec();

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invalid or already used invitation token');
    }

    const now = new Date();
    if (invitation.expiresAt.getTime() < now.getTime()) {
      throw new GoneException('Invitation has expired');
    }

    const updated = await this.invitationModel
      .findOneAndUpdate(
        {
          _id: invitation._id,
          status: InvitationStatus.PENDING,
          expiresAt: { $gt: now },
        },
        {
          $set: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: now,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException('Invalid or already used invitation token');
    }

    return updated;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
