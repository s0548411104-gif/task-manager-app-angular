import { Component, OnInit, inject, signal } from '@angular/core';
import { TeamsService } from '../../services/teams.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './team-list.html',
  styleUrl: './team-list.css'
})
export class TeamList implements OnInit {
  public teamsService = inject(TeamsService);

  newTeamNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  isCreateOpen = signal(false);
  
  ngOnInit() {
    this.teamsService.loadTeams();
  }

  toggleCreate() {
    this.isCreateOpen.update(value => !value);
  }

  createNewTeam() {
    if (this.newTeamNameControl.invalid) return;
    const name = this.newTeamNameControl.value!;

    this.teamsService.addTeam(name).subscribe({
      next: () => {
        this.newTeamNameControl.reset();
        this.isCreateOpen.set(false);
      },
      error: (err) => alert('שגיאה ביצירת הצוות')
    });
  }

  // הפונקציה החדשה למחיקת צוות
  deleteTeam(id: string, event: Event) {
    // מונע מהקליק לעבור לכרטיס עצמו (למנוע ניווט לפרויקטים)
    event.stopPropagation();
    
    if (confirm('האם את בטוחה שברצונך למחוק את הצוות? פעולה זו תמחק גם את כל הפרויקטים המשויכים אליו.')) {
      this.teamsService.deleteTeam(id).subscribe({
        next: () => {
          // הצוות ייעלם אוטומטית כי עדכנו את ה-Signal בסרוויס
          console.log('Team deleted successfully');
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'אין הרשאות למחוק צוות זה';
          alert('שגיאה במחיקה: ' + errorMessage);
        }
      });
    }
  }
}