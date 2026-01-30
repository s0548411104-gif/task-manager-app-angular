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

  // טעינת פרויקטים עם טיפול בשגיאת "אין צוות" (403)
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
  // אנחנו יוצרים גוף בקשה (Body) שמשתמש ב-ID שהגיע מהקומפוננטה (14)
  const body = { 
    teamId: Number(teamId), 
    name, 
    description 
  };

  // שליחה ישירה לשרת בלי לבדוק צוותים אחרים בדרך
  return this.http.post<Project>(this.apiUrl, body).pipe(
    tap((newProject) => {
      // עדכון הרשימה בתצוגה
      this.myProjects.update(list => [...list, newProject]);
    }),
    catchError((err) => {
      this.error.set('שגיאה ביצירת הפרויקט');
      return throwError(() => err);
    })
  );
}

  // --- פונקציות ה-CRUD הנוספות (קיימות רק בגרסה 1) ---

  deleteProject(projectId: string) {
    return this.http.delete(`${this.apiUrl}/${projectId}`).pipe(
      tap(() => {
        // הסרה מהתצוגה מיד לאחר מחיקה מוצלחת
        this.myProjects.update(list => list.filter(p => p.id !== projectId));
      })
    );
  }

  updateProject(projectId: string, name: string) {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}`, { name }).pipe(
      tap((updatedProj) => {
        // עדכון הפרויקט הספציפי בתוך הרשימה הקיימת
        this.myProjects.update(projects => 
          projects.map(p => p.id === projectId ? updatedProj : p)
        );
      })
    );
  }
}