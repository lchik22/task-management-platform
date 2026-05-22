import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-accept-invitation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './accept-invitation.page.html',
  styleUrl: './accept-invitation.page.css',
})
export class AcceptInvitationPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    token: [
      '',
      [
        Validators.required,
        Validators.minLength(64),
        Validators.maxLength(64),
        Validators.pattern(/^[a-fA-F0-9]+$/),
      ],
    ],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.form.patchValue({ token });
    }
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.acceptInvitation(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/projects');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.toErrorMessage(err));
      },
    });
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | null;
      if (body?.message) {
        return Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
      if (err.status === 410) return 'This invitation has expired.';
      if (err.status === 409) return 'This email is already registered.';
      if (err.status === 400) {
        return 'Invitation token is invalid or already used.';
      }
      if (err.status === 0) return 'Cannot reach the server.';
    }
    return 'Could not create the account. Try again.';
  }
}
