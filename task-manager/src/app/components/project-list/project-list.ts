import { Component, OnInit, inject, signal } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router'; // הוספתי את ActivatedRoute

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {
  projectsService = inject(ProjectsService);
  private route = inject(ActivatedRoute); // 👇 הוספתי: זה הכלי שקורא את הכתובת

  teamIdControl = new FormControl(''); // הורדתי את ה-Required כי אנחנו משיגים אותו אוטומטית
  nameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  descControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  isCreateOpen = signal(false);
  currentTeamId = '';

  // --- משתנים חדשים לעריכה ---
  editingProjectId = signal<string | null>(null); 
  editNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  ngOnInit() {
    // 👇 התיקון החשוב: משיכת ה-ID מהכתובת
    // מנסה למצוא 'teamId'. אם לא מוצא, מנסה למצוא 'id'.
    this.currentTeamId = this.route.snapshot.paramMap.get('teamId') || 
                         this.route.snapshot.paramMap.get('id') || '';

    console.log('🔍 ה-ID שנמצא בכתובת הוא:', this.currentTeamId);

    this.projectsService.loadProjects();
  }

  toggleCreate() {
    this.isCreateOpen.update(value => !value);
  }

  createNewProj() {
    // בדיקה 1: האם הכפתור בכלל עובד?
    alert('שלב 1: הפונקציה התחילה! הכפתור עובד.');

    // בדיקה 2: האם יש לנו ID של צוות?
    if (!this.currentTeamId) {
      alert('עצור! 🛑 הבעיה היא שאין לי ID של צוות (ריק). תסתכלי בקונסול.');
      return;
    }
    alert('שלב 2: יש ID צוות: ' + this.currentTeamId);

    // בדיקה 3: האם הטופס תקין?
    if (this.nameControl.invalid) {
      alert('עצור! 🛑 הטופס לא תקין. בדקי שכתבת לפחות 3 אותיות בשם.');
      return;
    }
    const nameVal = this.nameControl.value!;
    const descVal = this.descControl.value || '';
    alert('שלב 3: הנתונים תקינים. שם: ' + nameVal);

    // בדיקה 4: ניסיון שליחה
    alert('שלב 4: מנסה לשלוח לשרת... תמתיני רגע.');

    this.projectsService.addProject(this.currentTeamId, nameVal, descVal).subscribe({
      next: (res) => {
        alert('✅ הצלחה! השרת החזיר תשובה חיובית!');
        console.log(res);
        this.isCreateOpen.set(false);
        this.nameControl.reset();
        this.descControl.reset();
        this.projectsService.loadProjects(); // רענון הרשימה
      },
      error: (err) => {
        alert('❌ שגיאה! השרת נכשל.');
        console.log('פרטי השגיאה:', err);
        alert('הודעת השגיאה מהשרת: ' + JSON.stringify(err.error || err.message));
      }
    });
  }

  // --- הפונקציה החדשה למחיקה ---
  deleteProject(projectId: string, event: Event) {
    event.stopPropagation(); // מונע מהכרטיס להיפתח כשלוחצים על המחיקה
    
    if (confirm('בטוחה שאת רוצה למחוק את הפרויקט?')) {
      this.projectsService.deleteProject(projectId).subscribe({
        next: () => {
          console.log('Project deleted');
        },
        error: (err) => {
          console.error('Delete failed', err);
          alert('שגיאה במחיקה');
        }
      });
    }
  }

  // --- פונקציות חדשות לעריכה ---
  
  startEdit(project: any, event: Event) {
    event.stopPropagation();
    this.editingProjectId.set(project.id);
    this.editNameControl.setValue(project.name);
  }

  cancelEdit(event: Event) {
    event.stopPropagation();
    this.editingProjectId.set(null);
  }

  saveEdit(projectId: string, event: Event) {
    event.stopPropagation();
    if (this.editNameControl.invalid) return;

    const newName = this.editNameControl.value!;
    this.projectsService.updateProject(projectId, newName).subscribe({
      next: () => this.editingProjectId.set(null),
      error: () => alert('שגיאה בעדכון השם')
    });
  }
}