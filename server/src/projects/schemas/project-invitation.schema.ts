import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ProjectInvitationStatus } from '../types/project-invitation-status.enum';

export type ProjectInvitationDocument = HydratedDocument<ProjectInvitation>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class ProjectInvitation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  project!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  invitee!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  inviter!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ProjectInvitationStatus),
    default: ProjectInvitationStatus.PENDING,
    required: true,
  })
  status!: ProjectInvitationStatus;
}

export const ProjectInvitationSchema =
  SchemaFactory.createForClass(ProjectInvitation);

ProjectInvitationSchema.index(
  { project: 1, invitee: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ProjectInvitationStatus.PENDING },
  },
);
