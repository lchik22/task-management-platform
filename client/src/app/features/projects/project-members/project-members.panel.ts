import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Project } from '../../../core/models/project';
import { ProjectsService } from '../../../core/services/projects.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-project-members-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './project-members.panel.html',
  styleUrl: './project-members.panel.css',
})
export class ProjectMembersPanel {
  readonly project = input.required<Project>();
  readonly isOwner = input.required<boolean>();
  readonly removed = output<string>();

  private readonly service = inject(ProjectsService);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  remove(userId: string): void {
    if (!confirm('Remove this member from the project?')) return;
    this.error.set(null);
    this.busyId.set(userId);
    this.service.removeMember(this.project().id, userId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.removed.emit(userId);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(toErrorMessage(err, 'Could not remove member.'));
      },
    });
  }
}
