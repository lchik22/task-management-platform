import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { MyProjectInvitationsController } from './my-project-invitations.controller';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import {
  ProjectInvitation,
  ProjectInvitationSchema,
} from './schemas/project-invitation.schema';
import { Project, ProjectSchema } from './schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectInvitation.name, schema: ProjectInvitationSchema },
    ]),
    UsersModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [ProjectsController, MyProjectInvitationsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
