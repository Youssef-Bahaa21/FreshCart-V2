// This file is temporarily disabled for production build
// SSR is not used in the current deployment

import { APP_BASE_HREF } from '@angular/common';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const browserDist = join(__dirname, '../browser');

  server.use(express.static(browserDist));
  server.get('*', (req, res) => {
    res.sendFile(join(browserDist, 'index.html'));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
