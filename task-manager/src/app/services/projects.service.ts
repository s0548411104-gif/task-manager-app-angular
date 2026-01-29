import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Project } from '../models/types.model';
import { tap, switchMap, map, catchError } from 'rxjs/operators'; 
import { of, throwError } from 'rxjs'; 

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl; 
  private apiUrl = `${this.baseUrl}/projects`;

  myProjects = signal<Project[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadProjects() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<Project[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.myProjects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        // התיקון הקריטי: אם השרת מחזיר 403 (כי אין לך עדיין צוות), 
        // אנחנו מגדירים רשימה ריקה במקום לתת לאפליקציה לקרוס ולזרוק אותך ל-Login
        if (err.status === 403) {
          this.myProjects.set([]); 
          this.error.set(null); 
        } else {
          this.error.set('שגיאה בטעינת פרויקטים');
        }
        this.isLoading.set(false);
      }
    });
  }

  addProject(teamId: string, name: string, description: string) {
    const teamsUrl = `${this.baseUrl}/teams`;

    // שלב 1: בדיקה אם יש צוות קיים (מניעת 403 בשרת)
    return this.http.get<any[]>(teamsUrl).pipe(
      switchMap((teams) => {
        if (teams && teams.length > 0) {
          return of(teams[0].id);
        } else {
          // אין צוות - ניצור אחד חדש. השרת יוסיף אותך אוטומטית כ-Owner
          return this.http.post<any>(teamsUrl, { name: 'My Workspace' }).pipe(
            map(newTeam => newTeam.id)
          );
        }
      }),
      // שלב 2: יצירת הפרויקט עם ה-teamId החוקי
      switchMap((validTeamId) => {
        const body = { teamId: validTeamId, name, description };
        return this.http.post<Project>(this.apiUrl, body);
      }),
      // שלב 3: עדכון הרשימה בתצוגה
      tap((newProject) => {
        this.myProjects.update(list => [...list, newProject]);
      }),
      catchError((err) => {
        this.error.set('שגיאה ביצירת הפרויקט');
        return throwError(() => err);
      })
    );
  }

  deleteProject(projectId: string) {
    return this.http.delete(`${this.apiUrl}/${projectId}`).pipe(
      tap(() => {
        // עדכון ה-Signal: מסננים החוצה את הפרויקט שנמחק
        this.myProjects.update(list => list.filter(p => p.id !== projectId));
      })
    );
  }

  updateProject(projectId: string, name: string) {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}`, { name }).pipe(
      tap((updatedProj) => {
        this.myProjects.update(projects => 
          projects.map(p => p.id === projectId ? updatedProj : p)
        );
      })
    );
  }
}