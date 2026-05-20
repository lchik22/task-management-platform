import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ProjectRole } from '../types/project-role.enum';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ _id: false })
export class ProjectMember {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ProjectRole),
    required: true,
  })
  role!: ProjectRole;

  @Prop({ type: Date, required: true, default: () => new Date() })
  joinedAt!: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

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
export class Project {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  owner!: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members!: ProjectMember[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ 'members.user': 1 });
