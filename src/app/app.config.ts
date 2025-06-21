import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { headersInterceptor } from './core/interceptors/headers/headers.interceptor';
import { errorsInterceptor } from './core/interceptors/errors/errors.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),provideAnimations(), provideToastr(), provideHttpClient(withFetch() , withInterceptors([headersInterceptor , errorsInterceptor])),provideRouter(routes), provideClientHydration(withEventReplay())]
};
