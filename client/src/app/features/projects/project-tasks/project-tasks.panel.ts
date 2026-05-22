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
import { Project } from '../../../core/models/project';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task';
import { TasksService } from '../../../core/services/tasks.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-project-tasks-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './project-tasks.panel.html',
  styleUrl: './project-tasks.panel.css',
})
export class ProjectTasksPanel implements OnInit {
  readonly project = input.required<Project>();
  readonly canManage = input.required<boolean>();
  readonly currentUserId = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TasksService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly busyTaskId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly savingEditId = signal<string | null>(null);

  readonly statusFilter = signal<TaskStatus | null>(null);
  readonly assigneeFilter = signal<string>('');

  readonly createForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    priority: ['MEDIUM' as TaskPriority],
    assignee: [''],
    dueDate: [''],
  });

  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    priority: ['MEDIUM' as TaskPriority],
    assignee: [''],
    dueDate: [''],
  });

  readonly projectId = computed(() => this.project().id);

  ngOnInit(): void {
    this.refresh();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value ? (value as TaskStatus) : null);
    this.refresh();
  }

  onAssigneeChange(event: Event): void {
    this.assigneeFilter.set((event.target as HTMLSelectElement).value);
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service
      .list(this.projectId(), {
        status: this.statusFilter() ?? undefined,
        assignee: this.assigneeFilter() || undefined,
      })
      .subscribe({
        next: (items) => {
          this.tasks.set(items);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(toErrorMessage(err, 'Could not load tasks.'));
        },
      });
  }

  create(): void {
    this.createError.set(null);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    const { title, description, priority, assignee, dueDate } =
      this.createForm.getRawValue();
    this.service
      .create(this.projectId(), {
        title,
        description: description || undefined,
        priority,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.createForm.reset({
            title: '',
            description: '',
            priority: 'MEDIUM',
            assignee: '',
            dueDate: '',
          });
          this.refresh();
        },
        error: (err: unknown) => {
          this.creating.set(false);
          this.createError.set(toErrorMessage(err, 'Could not create task.'));
        },
      });
  }

  canChangeStatus(task: Task): boolean {
    if (this.canManage()) return true;
    if (task.creator === this.currentUserId()) return true;
    if (task.assignee && task.assignee === this.currentUserId()) return true;
    return false;
  }

  isCreator(task: Task): boolean {
    return task.creator === this.currentUserId();
  }

  onStatusSelect(event: Event, task: Task): void {
    const value = (event.target as HTMLSelectElement).value as TaskStatus;
    if (value === task.status) return;
    this.busyTaskId.set(task.id);
    this.service.updateStatus(this.projectId(), task.id, value).subscribe({
      next: (updated) => {
        this.busyTaskId.set(null);
        this.tasks.update((items) =>
          items.map((t) => (t.id === task.id ? updated : t)),
        );
      },
      error: () => {
        this.busyTaskId.set(null);
        this.refresh();
      },
    });
  }

  toggleEdit(task: Task): void {
    if (this.editingId() === task.id) {
      this.cancelEdit();
      return;
    }
    this.editingId.set(task.id);
    this.editForm.reset({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      assignee: task.assignee ?? '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(task: Task): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.savingEditId.set(task.id);
    const { title, description, priority, assignee, dueDate } =
      this.editForm.getRawValue();
    this.service
      .update(this.projectId(), task.id, {
        title,
        description: description || undefined,
        priority,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      .subscribe({
        next: (updated) => {
          this.savingEditId.set(null);
          this.editingId.set(null);
          this.tasks.update((items) =>
            items.map((t) => (t.id === task.id ? updated : t)),
          );
        },
        error: () => {
          this.savingEditId.set(null);
          this.refresh();
        },
      });
  }

  remove(task: Task): void {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    this.busyTaskId.set(task.id);
    this.service.remove(this.projectId(), task.id).subscribe({
      next: () => {
        this.busyTaskId.set(null);
        this.tasks.update((items) => items.filter((t) => t.id !== task.id));
      },
      error: () => {
        this.busyTaskId.set(null);
      },
    });
  }

  statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return 'To do';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'DONE':
        return 'Done';
    }
  }
}
