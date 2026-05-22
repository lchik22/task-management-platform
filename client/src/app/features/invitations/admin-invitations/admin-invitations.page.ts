import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Invitation } from '../../../core/models/invitation';
import { InvitationsService } from '../../../core/services/invitations.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-admin-invitations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-invitations.page.html',
  styleUrl: './admin-invitations.page.css',
})
export class AdminInvitationsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(InvitationsService);

  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly successEmail = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.refresh();
  }

  submit(): void {
    this.formError.set(null);
    this.successEmail.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const email = this.form.controls.email.value;
    this.service.create(email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successEmail.set(email);
        this.form.reset({ email: '' });
        this.refresh();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.formError.set(toErrorMessage(err, 'Could not send invitation.'));
      },
    });
  }

  revoke(inv: Invitation): void {
    this.busyId.set(inv.id);
    this.service.revoke(inv.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.refresh();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.loadError.set(toErrorMessage(err, 'Could not revoke invitation.'));
      },
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.list().subscribe({
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
}
