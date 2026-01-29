import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/interceptors';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  // providers: [
  //   provideBrowserGlobalErrorListeners(),
  //   provideRouter(routes),
  //   provideHttpClient(),
  //   provideHttpClient(withInterceptors([authInterceptor])),
  //   provideAnimations() // <--- זה חייב להיות כאן!
  // ]

  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // איחוד הקריאות ל-HttpClient - חשוב מאוד!
    provideHttpClient(withInterceptors([authInterceptor])), 
    provideAnimations() 
  ]
};

