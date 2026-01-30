import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { TeamsService } from '../../services/teams.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, CommonModule],
  templateUrl: './team-list.html',
  styleUrl: './team-list.css'
})
export class TeamList implements OnInit {
  public teamsService = inject(TeamsService);

  // בקרים לטפסים
  newTeamNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  selectedUserEmail = new FormControl('', [Validators.required]); // מחזיק את ה-ID של המשתמש שנבחר

  // סיגנלים לניהול מצב התצוגה
  isCreateOpen = signal(false);
  activeTeamForMember = signal<string | null>(null); // שומר איזה צוות פתוח כרגע להוספת חבר
  currentTeamMembers = signal<any[]>([]); // רשימת החברים של הצוות שנבחר כרגע להצגה מהירה

  constructor() {
    // מנגנון ה-Effect: מזהה מתי נטענו צוותים חדשים ומושך להם חברים אם חסר
    effect(() => {
      const teams = this.teamsService.myTeams();
      teams.forEach(team => {
        // טוען חברים רק לצוותים שעדיין לא ניסינו לטעון להם (members הוא undefined)
        if (team.members === undefined) {
          this.fetchMembersForTeam(team);
        }
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    // טוענים את הצוותים ואת רשימת המשתמשים הכללית
    this.teamsService.loadTeams();
    this.teamsService.loadAllUsers();
  }

  // משיכת חברים עבור אובייקט צוות ספציפי ועדכון ה-Service
  fetchMembersForTeam(team: any) {
    this.teamsService.getTeamMembers(team.id).subscribe({
      next: (members) => {
        this.teamsService.updateTeamMembers(team.id, members);
      },
      error: (err) => {
        console.error('שגיאה בטעינת חברים לצוות', team.id, err);
        this.teamsService.updateTeamMembers(team.id, []); // מונע ניסיונות טעינה חוזרים בשגיאה
      }
    });
  }

  // --- ניהול צוותים ---

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

  deleteTeam(id: string, event: Event) {
    event.stopPropagation(); // מונע ניווט בטעות
    
    if (confirm('האם את בטוחה שברצונך למחוק את הצוות? פעולה זו תמחק גם את כל הפרויקטים המשויכים אליו.')) {
      this.teamsService.deleteTeam(id).subscribe({
        next: () => {
          console.log('Team deleted successfully');
          if (this.activeTeamForMember() === String(id)) {
            this.activeTeamForMember.set(null);
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'אין הרשאות למחוק צוות זה';
          alert('שגיאה במחיקה: ' + errorMessage);
        }
      });
    }
  }

  // --- ניהול חברים בצוות ---

  loadMembers(teamId: any) {
    this.teamsService.getTeamMembers(teamId).subscribe({
      next: (members) => this.currentTeamMembers.set(members),
      error: () => console.error('שגיאה בטעינת חברי צוות')
    });
  }

  toggleAddMember(teamId: any) {
    const idStr = String(teamId);
    if (this.activeTeamForMember() === idStr) {
      this.activeTeamForMember.set(null);
      this.currentTeamMembers.set([]);
    } else {
      this.activeTeamForMember.set(idStr);
      this.loadMembers(teamId); // טעינת החברים ברגע שפותחים את תיבת ההוספה
    }
  }

  submitAddMember(teamId: any) {
    const userId = this.selectedUserEmail.value; 
    if (!userId) return;

    this.teamsService.addMember(teamId, userId).subscribe({
      next: () => {
        alert('החבר נוסף בהצלחה! 🎉');
        this.activeTeamForMember.set(null);
        this.selectedUserEmail.reset();
        this.teamsService.loadTeams(); // רענון כדי לעדכן מונים וחברים
      },
      error: (err) => alert('שגיאה: ' + (err.error?.error || 'לא ניתן להוסיף חבר'))
    });
  }
}