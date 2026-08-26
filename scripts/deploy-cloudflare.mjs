import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const token = process.env.CANVAS_ACCESS_TOKEN;

if (!token) {
  console.error('CANVAS_ACCESS_TOKEN is not available in the Cloudflare build environment.');
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), 'coursebuild-secrets-'));
const secretsPath = join(tempDir, 'secrets.json');
let exitCode = 1;

try {
  writeFileSync(
    secretsPath,
    JSON.stringify({ CANVAS_ACCESS_TOKEN: token }),
    { encoding: 'utf8', mode: 0o600 }
  );

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['wrangler', 'deploy', '--secrets-file', secretsPath],
    { stdio: 'inherit', env: process.env }
  );

  if (result.error) {
    console.error('Wrangler could not be started:', result.error.message);
  } else {
    exitCode = result.status ?? 1;
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

process.exitCode = exitCode;
