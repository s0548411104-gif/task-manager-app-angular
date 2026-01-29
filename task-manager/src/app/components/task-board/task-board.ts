import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { TasksService } from '../../services/tasks.service'; 
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { Task, TaskComment } from '../../models/types.model';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router'; // <--- הוספנו את זה

@Component({
  selector: 'app-task-board',
  standalone: true, 
  imports: [ReactiveFormsModule, CommonModule, DragDropModule],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard implements OnInit {
  public tasksService = inject(TasksService);
  private route = inject(ActivatedRoute); // <--- הזרקנו את ה-Route

  // הגדרות בסיסיות
  currentProjectId = ''; // <--- שונה מ-'1' לריק, יתמלא ב-OnInit
  searchTerm = signal('');
  isCreateOpen = signal(false);
  newTaskControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  // ניהול תגובות ומשימה נבחרת
  selectedTask = signal<Task | null>(null);
  currentComments = signal<TaskComment[]>([]); 
  newCommentControl = new FormControl('', [Validators.required]);

  // רשימות מחושבות
  todoTasks = computed(() => this.filterTasksByStatus('todo'));
  inProgressTasks = computed(() => this.filterTasksByStatus('in_progress'));
  doneTasks = computed(() => this.filterTasksByStatus('done'));

  ngOnInit() {
    // שליפת ה-ID האמיתי מהכתובת (למשל מה-URL: projects/6)
    const idFromUrl = this.route.snapshot.paramMap.get('id');
    
    if (idFromUrl) {
      this.currentProjectId = idFromUrl;
      console.log('טוען משימות עבור פרויקט מספר:', this.currentProjectId);
      this.tasksService.loadTasks(this.currentProjectId);
    } else {
      console.error('שגיאה: לא נמצא מזהה פרויקט בכתובת ה-URL');
    }
  }

  // לוגיקת סינון
  private filterTasksByStatus(status: string): Task[] {
    const term = this.searchTerm().toLowerCase();
    const allTasks = this.tasksService.myTasks();

    return allTasks.filter(task => {
      const matchesStatus = task.status === status;
      const matchesSearch = task.title.toLowerCase().includes(term) || 
                            (task.description || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  toggleCreate() {
    this.isCreateOpen.update(value => !value);
  }

  // יצירת משימה - עכשיו משתמש ב-ID הנכון
  createNewTask() {
    if (this.newTaskControl.invalid) return;
    
    const title = this.newTaskControl.value!;
    
    this.tasksService.addTask(
        this.currentProjectId, 
        title,                
        '',   
        new Date().toISOString(),
        'normal',             
        'todo'                
    ).subscribe({
      next: () => {
        this.newTaskControl.reset();
        this.isCreateOpen.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('שגיאה ביצירת המשימה. וודא שאתה חבר בצוות הפרויקט.');
      }
    });
  }

  deleteTask(taskId: string) {
    if(!confirm('האם למחוק את המשימה?')) return;

    this.tasksService.deleteTask(taskId).subscribe({
      error: () => alert('שגיאה במחיקת המשימה')
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) return;

    const task = event.item.data as Task;
    const newStatus = event.container.id as 'todo' | 'in_progress' | 'done';

    this.tasksService.myTasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    );

    this.tasksService.updateTask(task.id, { status: newStatus }).subscribe({
      error: (err) => {
        console.error('שגיאה בעדכון הסטטוס:', err);
        this.tasksService.loadTasks(this.currentProjectId);
      }
    });
  }

  updatePriority(task: Task, event: any) {
    const newPriority = event.target.value;
    this.tasksService.updateTask(task.id, { priority: newPriority }).subscribe({
      error: () => alert('שגיאה בעדכון עדיפות')
    });
  }

  openComments(task: Task) {
    this.selectedTask.set(task); 
    this.tasksService.getComments(task.id).subscribe({
      next: (data) => this.currentComments.set(data),
      error: () => alert('שגיאה בטעינת התגובות')
    });
  }

  closeComments() {
    this.selectedTask.set(null); 
    this.currentComments.set([]); 
    this.newCommentControl.reset();
  }

  sendComment() {
    if (this.newCommentControl.invalid) return;
    const task = this.selectedTask();
    if (!task) return;

    const text = this.newCommentControl.value!;
    this.tasksService.addComment(task.id, text).subscribe({
      next: (newComment) => {
        this.currentComments.update(list => [...list, newComment]);
        this.newCommentControl.reset();
      },
      error: (err) => alert('שגיאה בשליחת תגובה')
    });
  }
}