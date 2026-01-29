import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Task, TaskComment } from '../models/types.model';
import { AuthService } from './auth.service'; 
import { tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}/tasks`;
  private commentsUrl = `${environment.apiUrl}/comments`;

  myTasks = signal<Task[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadTasks(projectId: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<Task[]>(this.apiUrl, { 
      params: { projectId } 
    }).subscribe({
      next: (data) => {
        this.myTasks.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('לא הצלחנו לטעון את המשימות.');
        this.isLoading.set(false);
      }
    });
  }

  addTask(
    projectId: string, 
    title: string, 
    description: string,
    dueDate: string = new Date().toISOString(),
    priority: 'low' | 'normal' | 'high' = 'normal',
    status: 'todo' | 'in_progress' | 'done' = 'todo'
  ) {
    
    const currentUserId = this.authService.currentUser()?.id;

    const body = {
      projectId,
      title,
      description,
      dueDate,
      priority,
      status,
      assigneeId: currentUserId, 
      orderIndex: 0           
    };

    return this.http.post<Task>(this.apiUrl, body).pipe(
      tap((newTask) => {
        this.myTasks.update(list => [...list, newTask]);
        this.error.set(null);
      }),
      catchError((err) => {
        this.error.set('שגיאה ביצירת המשימה');
        return throwError(() => err);
      })
    );
  } 

  deleteTask(taskId: string) {
    return this.http.delete(`${this.apiUrl}/${taskId}`).pipe(
      tap(() => {
        this.myTasks.update(tasks => tasks.filter(t => t.id !== taskId));
      }),
      catchError((err) => {
        this.error.set('שגיאה במחיקת המשימה');
        return throwError(() => err);
      })
    );
  }

  updateTask(taskId: string, changes: any) {
    return this.http.patch<Task>(`${this.apiUrl}/${taskId}`, changes).pipe(
      tap((updatedTask) => {
        this.myTasks.update(tasks => 
          tasks.map(t => t.id === taskId ? updatedTask : t)
        );
      }),
      catchError((err) => {
        this.error.set('שגיאה בעדכון המשימה');
        return throwError(() => err);
      })
    );
  }

  // --- תגובות (Comments) מעודכן ל-TaskComment ---

  // קבלת כל התגובות למשימה מסוימת
  getComments(taskId: string) {
    // שינוי כאן: השתמשתי ב-TaskComment במקום ב-Comment
    return this.http.get<TaskComment[]>(this.commentsUrl, { 
      params: { taskId } 
    });
  }

  // הוספת תגובה חדשה
 // הוספת תגובה חדשה - מותאם בדיוק לאינטרפייס שלך
  addComment(taskId: string, text: string) {
    // השרת דורש taskId (במילה אחת) ו-body
    const bodyToSend = {
      taskId: taskId, 
      body: text
    };

    return this.http.post<TaskComment>(this.commentsUrl, bodyToSend);
  }
}