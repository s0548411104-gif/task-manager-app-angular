import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse, User } from '../models/types.model';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    const token = this.getToken();
    if (token) {
      const user = this.getUserFromToken(token);
      if (user) {
        this.currentUser.set(user);
      }
    }
  }

  login(user: User) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.currentUser.set(response.user);
        }
      })
    );
  }

  register(user: User) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.currentUser.set(response.user);
        }
      })
    );
  }

  private saveToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  logout() {
    sessionStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload = token.split('.')[1];

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedJson = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(decodedJson);
    } catch (e) {
      console.error('Failed to decode token', e);
      return null;
    }
  }
}