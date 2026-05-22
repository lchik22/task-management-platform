import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../../core/models/task';
import { TasksService } from '../../../core/services/tasks.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-my-tasks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './my-tasks.page.html',
  styleUrl: './my-tasks.page.css',
})
export class MyTasksPage implements OnInit {
  private readonly service = inject(TasksService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly statusFilter = signal<TaskStatus | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value ? (value as TaskStatus) : null);
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.listMine(this.statusFilter() ?? undefined).subscribe({
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
