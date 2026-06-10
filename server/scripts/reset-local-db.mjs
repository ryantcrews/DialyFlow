/**
 * Local dev: wipe D1 state and re-apply migrations.
 * Stop `npm run dev` first if the reset fails with EBUSY.
 */
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const d1State = join(root, '.wrangler', 'state', 'v3', 'd1');

try {
  rmSync(d1State, { recursive: true, force: true });
  console.log('Removed local D1 state.');
} catch (err) {
  const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
  if (code === 'EBUSY') {
    console.error('Could not delete D1 folder (dev server running?). Stop npm run dev and retry.');
    process.exit(1);
  }
  throw err;
}

execSync('npx wrangler d1 migrations apply dialyrounds --local', {
  cwd: root,
  stdio: 'inherit',
});

console.log('Local database reset. Default admin: admin@dialyrounds.local / ChangeMe123!');
