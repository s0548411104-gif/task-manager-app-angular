import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TeamList } from './components/team-list/team-list';
import { ProjectList } from './components/project-list/project-list';
import { TaskBoard } from './components/task-board/task-board';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { 
    path: '', 
    canActivate: [authGuard], 
    children: [
      { path: 'teams', component: TeamList },
      { path: 'teams/:teamId/projects', component: ProjectList },
      { path: 'projects', component: ProjectList },
      { path: 'projects/:id/tasks', component: TaskBoard },
      { path: 'tasks', component: TaskBoard },
    ]
  },
  
  { path: '**', redirectTo: 'login' }
];