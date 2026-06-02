import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { TaskPriority } from '../types/task-priority.enum';
import { TaskStatus } from '../types/task-status.enum';

export type TaskDocument = HydratedDocument<Task>;

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
export class Task {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  project!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    required: true,
  })
  status!: TaskStatus;

  @Prop({
    type: String,
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIUM,
    required: true,
  })
  priority!: TaskPriority;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  assignee!: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  creator!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  dueDate!: Date | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ project: 1, status: 1 });
