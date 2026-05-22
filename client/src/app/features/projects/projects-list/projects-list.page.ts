import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectWithRole } from '../../../core/models/project';
import { ProjectsService } from '../../../core/services/projects.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-projects-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './projects-list.page.html',
  styleUrl: './projects-list.page.css',
})
export class ProjectsListPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProjectsService);

  readonly projects = signal<ProjectWithRole[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.refresh();
  }

  submit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { title, description } = this.form.getRawValue();
    this.service
      .create({ title, description: description || undefined })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.form.reset({ title: '', description: '' });
          this.refresh();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.formError.set(toErrorMessage(err, 'Could not create project.'));
        },
      });
  }

  private refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.list().subscribe({
      next: (items) => {
        this.projects.set(items);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toErrorMessage(err, 'Could not load projects.'));
      },
    });
  }
}
