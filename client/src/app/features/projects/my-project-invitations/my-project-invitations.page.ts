import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectInvitation } from '../../../core/models/project';
import { ProjectsService } from '../../../core/services/projects.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-my-project-invitations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './my-project-invitations.page.html',
  styleUrl: './my-project-invitations.page.css',
})
export class MyProjectInvitationsPage implements OnInit {
  private readonly service = inject(ProjectsService);

  readonly invitations = signal<ProjectInvitation[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly acceptedProjectId = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.listMyInvitations().subscribe({
      next: (items) => {
        this.invitations.set(items);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toErrorMessage(err, 'Could not load invitations.'));
      },
    });
  }

  accept(inv: ProjectInvitation): void {
    this.busyId.set(inv.id);
    this.service.acceptMyInvitation(inv.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.acceptedProjectId.set(this.projectId(inv));
        this.refresh();
      },
      error: () => {
        this.busyId.set(null);
        this.refresh();
      },
    });
  }

  decline(inv: ProjectInvitation): void {
    this.busyId.set(inv.id);
    this.service.declineMyInvitation(inv.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.refresh();
      },
      error: () => {
        this.busyId.set(null);
        this.refresh();
      },
    });
  }

  projectTitle(inv: ProjectInvitation): string {
    const p = inv.project;
    return typeof p === 'string' ? p : (p.title ?? p.id);
  }

  projectId(inv: ProjectInvitation): string {
    const p = inv.project;
    return typeof p === 'string' ? p : p.id;
  }

  inviterName(inv: ProjectInvitation): string {
    const i = inv.inviter;
    if (typeof i === 'string') return i;
    const name = `${i.firstName ?? ''} ${i.lastName ?? ''}`.trim();
    return name || i.email || i.id;
  }
}
