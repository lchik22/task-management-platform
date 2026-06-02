import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { InvitationStatus } from '../types/invitation-status.enum';

export type InvitationDocument = HydratedDocument<Invitation>;

const PERSISTED_STATUSES = [
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
  InvitationStatus.REVOKED,
];

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret: Record<string, unknown>) => {
      const expiresAt = ret.expiresAt as Date | undefined;
      if (
        ret.status === InvitationStatus.PENDING &&
        expiresAt instanceof Date &&
        expiresAt.getTime() < Date.now()
      ) {
        ret.status = InvitationStatus.EXPIRED;
      }
      delete ret.tokenHash;
      delete ret._id;
      return ret;
    },
  },
})
export class Invitation {
  @Prop({
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, required: true, unique: true, select: false })
  tokenHash!: string;

  @Prop({
    type: String,
    enum: PERSISTED_STATUSES,
    default: InvitationStatus.PENDING,
    required: true,
  })
  status!: InvitationStatus;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  invitedBy!: Types.ObjectId;

  @Prop({ type: Date })
  acceptedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.index(
  { email: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: InvitationStatus.PENDING },
  },
);
