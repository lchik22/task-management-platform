import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Project,
  ProjectInvitation,
  ProjectRole,
} from '../../../core/models/project';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { toErrorMessage } from '../../../shared/error-message';
import { ProjectMembersPanel } from '../project-members/project-members.panel';
import { ProjectTasksPanel } from '../project-tasks/project-tasks.panel';

@Component({
  selector: 'app-project-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ProjectMembersPanel,
    ProjectTasksPanel,
  ],
  templateUrl: './project-detail.page.html',
  styleUrl: './project-detail.page.css',
})
export class ProjectDetailPage implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(ProjectsService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly project = signal<Project | null>(null);
  readonly invitations = signal<ProjectInvitation[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busyLeave = signal(false);
  readonly busyDelete = signal(false);

  readonly savingEdit = signal(false);
  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
  });

  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly inviteSubmitting = signal(false);
  readonly inviteError = signal<string | null>(null);
  readonly inviteSuccess = signal<string | null>(null);
  readonly busyInvId = signal<string | null>(null);

  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  readonly myRole = computed<ProjectRole | 'GUEST'>(() => {
    const userId = this.currentUserId();
    const proj = this.project();
    if (!userId || !proj) return 'GUEST';
    const m = proj.members.find((m) => m.user === userId);
    return m?.role ?? 'GUEST';
  });
  readonly isOwner = computed(() => this.myRole() === 'OWNER');

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.get(this.id()).subscribe({
      next: (proj) => {
        this.project.set(proj);
        this.editForm.patchValue({
          title: proj.title,
          description: proj.description ?? '',
        });
        this.loading.set(false);
        if (this.isOwner()) {
          this.loadInvitations();
        }
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toErrorMessage(err, 'Could not load project.'));
      },
    });
  }

  private loadInvitations(): void {
    this.service.listInvitations(this.id()).subscribe({
      next: (items) => this.invitations.set(items),
      error: () => undefined,
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.actionError.set(null);
    this.savingEdit.set(true);
    const { title, description } = this.editForm.getRawValue();
    this.service
      .update(this.id(), { title, description: description || undefined })
      .subscribe({
        next: (proj) => {
          this.project.set(proj);
          this.savingEdit.set(false);
        },
        error: (err: unknown) => {
          this.savingEdit.set(false);
          this.actionError.set(toErrorMessage(err, 'Could not save changes.'));
        },
      });
  }

  leave(): void {
    if (!confirm('Leave this project? You will lose access to its tasks.')) {
      return;
    }
    this.actionError.set(null);
    this.busyLeave.set(true);
    this.service.leave(this.id()).subscribe({
      next: () => {
        this.busyLeave.set(false);
        void this.router.navigate(['/projects']);
      },
      error: (err: unknown) => {
        this.busyLeave.set(false);
        this.actionError.set(toErrorMessage(err, 'Could not leave project.'));
      },
    });
  }

  deleteProject(): void {
    if (
      !confirm(
        'Delete this project? All its tasks and invitations will be removed permanently.',
      )
    ) {
      return;
    }
    this.actionError.set(null);
    this.busyDelete.set(true);
    this.service.remove(this.id()).subscribe({
      next: () => {
        this.busyDelete.set(false);
        void this.router.navigate(['/projects']);
      },
      error: (err: unknown) => {
        this.busyDelete.set(false);
        this.actionError.set(toErrorMessage(err, 'Could not delete project.'));
      },
    });
  }

  onMemberRemoved(memberId: string): void {
    const proj = this.project();
    if (!proj) return;
    this.project.set({
      ...proj,
      members: proj.members.filter((m) => m.user !== memberId),
    });
  }

  invite(): void {
    this.inviteError.set(null);
    this.inviteSuccess.set(null);
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.inviteSubmitting.set(true);
    const email = this.inviteForm.controls.email.value;
    this.service.createInvitation(this.id(), { email }).subscribe({
      next: () => {
        this.inviteSubmitting.set(false);
        this.inviteSuccess.set(`Invited ${email}.`);
        this.inviteForm.reset({ email: '' });
        this.loadInvitations();
      },
      error: (err: unknown) => {
        this.inviteSubmitting.set(false);
        this.inviteError.set(toErrorMessage(err, 'Could not invite user.'));
      },
    });
  }

  revokeInvitation(inv: ProjectInvitation): void {
    this.busyInvId.set(inv.id);
    this.service.revokeInvitation(this.id(), inv.id).subscribe({
      next: () => {
        this.busyInvId.set(null);
        this.loadInvitations();
      },
      error: () => {
        this.busyInvId.set(null);
        this.loadInvitations();
      },
    });
  }

  inviteeEmail(inv: ProjectInvitation): string {
    const i = inv.invitee;
    if (typeof i === 'string') return i;
    if (i.email) return i.email;
    const name = `${i.firstName ?? ''} ${i.lastName ?? ''}`.trim();
    return name || i.id;
  }
}
