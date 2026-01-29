import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Team } from '../models/types.model';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teams`;

  myTeams = signal<Team[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadTeams() {
    this.isLoading.set(true);
    this.http.get<Team[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.myTeams.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('שגיאה בטעינה');
        this.isLoading.set(false);
      }
    });
  }

  addTeam(name: string) {
    return this.http.post<Team>(this.apiUrl, { name }).pipe(
      tap((newTeam) => {
        this.myTeams.update(currentTeams => [...currentTeams, newTeam]);
      })
    );
  }

  deleteTeam(teamId: string) {
    return this.http.delete(`${this.apiUrl}/${teamId}`).pipe(
      tap(() => {
        // הסרת הצוות מהרשימה המקומית (Signal) ללא צורך בטעינה מחדש
        this.myTeams.update(teams => teams.filter(t => t.id !== teamId));
      })
    );
  }
}