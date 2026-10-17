// Runs automatically after "npm install" at the project root ("postinstall" script).
// On the host (Hostinger only runs "npm install"): installs the server and the client,
// then builds the interface, like "npm run build".
// On a development computer already installed: does nothing.
//
// The build runs if NODE_ENV is "production" or if the server dependencies
// aren't installed yet (fresh copy of the repository). RRD_SKIP_BUILD=1 prevents it.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const production = process.env.NODE_ENV === 'production';
const freshCopy = !existsSync('server/node_modules');

if (process.env.RRD_SKIP_BUILD === '1' || (!production && !freshCopy)) {
  process.exit(0);
}

console.log(`[postinstall] ${production ? 'Production' : 'New copy'}: installing server and client, then building the client…`);
execSync('npm run build', { stdio: 'inherit' });
