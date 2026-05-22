import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Invitation } from '../models/invitation';

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/invitations`;

  list() {
    return this.http.get<Invitation[]>(this.base);
  }

  create(email: string) {
    return this.http.post<Invitation>(this.base, { email });
  }

  revoke(id: string) {
    return this.http.post<Invitation>(`${this.base}/${id}/revoke`, {});
  }
}
