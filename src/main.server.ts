// This file is temporarily disabled for production build
// SSR is not used in the current deployment

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { serverConfig } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, serverConfig);

export default bootstrap;
