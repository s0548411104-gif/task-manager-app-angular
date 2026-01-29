import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink], // חובה לטפסים ולקישורים
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required], // לפי ה-API השדה נקרא name
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // ההרשמה הצליחה! ה-Service כבר שמר את הטוקן.
          // נעביר את המשתמש לדף הצוותים
          this.router.navigate(['/teams']);
        },
        error: (err) => {
          console.error(err);
          alert('שגיאה בהרשמה. אולי האימייל תפוס?');
        }
      });
    }
  }
}