import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {
  projectsService = inject(ProjectsService);
  private route = inject(ActivatedRoute);

  // טופס יצירה
  nameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  descControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  
  // משתני מצב
  isCreateOpen = signal(false);
  currentTeamId = ''; 
  teamIdSignal = signal<string>(''); 

  // --- לוגיקת סינון ---
  filteredProjects = computed(() => {
    const allProjects = this.projectsService.myProjects();
    const tid = this.teamIdSignal();
    // אם אין ID בכתובת, אנחנו מציגים את כל הפרויקטים (לפי הנתיב /projects הכללי)
    if (!tid) return allProjects; 
    return allProjects.filter(p => String(p.team_id) === tid);
  });

  // --- משתני עריכה ---
  editingProjectId = signal<string | null>(null); 
  editNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  ngOnInit() {
    /**
     * שינוי קטן אך קריטי: 
     * אנחנו נרשמים לשינויים בפרמטרים כדי להתעדכן בזמן אמת.
     */
    this.route.paramMap.subscribe(params => {
      // אנחנו מחפשים את ה-teamId (מהנתיב הספציפי) או את ה-id (מהנתיב הכללי)
      const id = params.get('teamId') || params.get('id') || '';
      
      // חשוב: אנחנו מעדכנים את המשתנה בערך החדש (אפילו אם הוא ריק)
      // זה מה שמונע מה-ID של "שולמית" להישאר שם לתמיד
      this.currentTeamId = id;
      this.teamIdSignal.set(id); 

      console.log('📍 ה-ID המעודכן בכתובת הוא:', id || 'ריק (נתיב כללי)');
      this.projectsService.loadProjects();
    });
  }

  toggleCreate() {
    this.isCreateOpen.update(value => !value);
  }

  createNewProj() {
    // השארתי את ה-Alerts לבקשתך
    alert('שלב 1: הפונקציה התחילה!');

    // אם אנחנו בנתיב הכללי /projects, אין לנו teamId ואי אפשר ליצור פרויקט
    if (!this.currentTeamId) {
      alert('עצור! 🛑 לא ניתן ליצור פרויקט בנתיב הכללי. אנא כנסי לצוות ספציפי דרך דף הצוותים.');
      console.error('Missing currentTeamId - check your URL');
      return;
    }
    
    // כאן תראי ב-Alert את ה-ID האמיתי שיישלח ב-Payload
    alert('שלב 2: שולח בקשה ליצירה בצוות מספר: ' + this.currentTeamId);

    if (this.nameControl.invalid) {
      alert('עצור! 🛑 שם הפרויקט קצר מדי.');
      return;
    }

    const nameVal = this.nameControl.value!;
    const descVal = this.descControl.value || '';

    this.projectsService.addProject(this.currentTeamId, nameVal, descVal).subscribe({
      next: (res) => {
        alert('✅ הצלחה! הפרויקט נוצר בצוות ' + this.currentTeamId);
        this.isCreateOpen.set(false);
        this.nameControl.reset();
        this.descControl.reset();
        this.projectsService.loadProjects(); 
      },
      error: (err) => {
        alert('❌ שגיאה ביצירה. בדקי את הקונסול.');
        console.error('פרטי השגיאה:', err);
      }
    });
  }

  // --- פונקציות מחיקה ועריכה ---

  deleteProject(projectId: string, event: Event) {
    event.stopPropagation();
    if (confirm('בטוחה שאת רוצה למחוק את הפרויקט?')) {
      this.projectsService.deleteProject(projectId).subscribe({
        next: () => console.log('Project deleted'),
        error: (err) => alert('שגיאה במחיקה')
      });
    }
  }

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