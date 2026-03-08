/**
 * NovaBank Infrastructure Pre-Flight Validation Suite
 *
 * 9 categories of checks that validate the system is ready to run.
 * Tests that require live services (API, dev server, Docker) are guarded
 * by beforeAll probes and gracefully skipped when the service is absent.
 * All failure messages include an actionable remedy.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5174;
// PLAYWRIGHT_EXPECTED_FRONTEND_PORT removed — the assertion below uses FRONTEND_PORT directly.

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Try to open a TCP connection; resolves true if successful within timeoutMs. */
function checkPort(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const cleanup = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => cleanup(true));
    socket.on('timeout', () => cleanup(false));
    socket.on('error', () => cleanup(false));
    socket.connect(port, host);
  });
}

/** Perform an HTTP GET and resolve with { statusCode, body }. */
function httpGet(url, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/** Return true if a CLI command can be found. */
function commandAvailable(cmd) {
  const result = spawnSync(cmd, ['--version'], { shell: true, stdio: 'pipe' });
  return result.status === 0;
}

/** Parse a version string like "18.17.0" and return [major, minor, patch]. */
function parseVersion(str) {
  return (str || '').replace(/^v/, '').split('.').map(Number);
}

// ─── 1. System requirements ──────────────────────────────────────────────────

describe('1. System requirements', () => {
  it('Node.js version is >= 18', () => {
    const raw = process.version;
    const [major] = parseVersion(raw);
    expect(major, `Node.js ${raw} is too old. Upgrade to Node.js 18 or later: https://nodejs.org`).toBeGreaterThanOrEqual(18);
  });

  it('npm version is >= 8', () => {
    const result = spawnSync('npm', ['--version'], { shell: true, stdio: 'pipe' });
    const raw = result.stdout?.toString().trim() || '';
    const [major] = parseVersion(raw);
    expect(major, `npm ${raw} is too old. Run: npm install -g npm@latest`).toBeGreaterThanOrEqual(8);
  });

  it('backend node_modules are installed', () => {
    const dir = path.join(BACKEND_DIR, 'node_modules');
    expect(
      fs.existsSync(dir),
      `Backend dependencies are missing. Run: cd backend && npm install`
    ).toBe(true);
  });

  it('frontend node_modules are installed', () => {
    const dir = path.join(FRONTEND_DIR, 'node_modules');
    expect(
      fs.existsSync(dir),
      `Frontend dependencies are missing. Run: cd frontend && npm install`
    ).toBe(true);
  });
});

// ─── 2. Environment config ───────────────────────────────────────────────────

describe('2. Environment config', () => {
  it('backend package.json is present and valid JSON', () => {
    const pkgPath = path.join(BACKEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath), `backend/package.json is missing — repository may be incomplete`).toBe(true);
    const raw = fs.readFileSync(pkgPath, 'utf8');
    expect(() => JSON.parse(raw), 'backend/package.json contains invalid JSON').not.toThrow();
  });

  it('frontend package.json is present and valid JSON', () => {
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath), `frontend/package.json is missing — repository may be incomplete`).toBe(true);
    const raw = fs.readFileSync(pkgPath, 'utf8');
    expect(() => JSON.parse(raw), 'frontend/package.json contains invalid JSON').not.toThrow();
  });

  it('root package.json contains test:infra script', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(
      pkg.scripts?.['test:infra'],
      `root package.json is missing "test:infra" script. Add it to run infrastructure checks.`
    ).toBeDefined();
  });

  it('backend jest.config.js is present', () => {
    const cfgPath = path.join(BACKEND_DIR, 'jest.config.js');
    expect(
      fs.existsSync(cfgPath),
      `backend/jest.config.js is missing — backend tests won't run. Create it with testEnvironment: 'node'.`
    ).toBe(true);
  });

  it('frontend vitest.config.js is present', () => {
    const cfgPath = path.join(FRONTEND_DIR, 'vitest.config.js');
    expect(
      fs.existsSync(cfgPath),
      `frontend/vitest.config.js is missing — frontend tests won't run. Create it with environment: 'jsdom'.`
    ).toBe(true);
  });
});

// ─── 3. Docker services ──────────────────────────────────────────────────────

describe('3. Docker services', () => {
  let dockerAvailable = false;

  beforeAll(() => {
    const result = spawnSync('docker', ['info'], { shell: true, stdio: 'pipe', timeout: 3000 });
    dockerAvailable = result.status === 0;
    if (!dockerAvailable) {
      console.info(
        '\n  ℹ  Docker is not running or not installed — Docker checks will be skipped.\n' +
        '     This is expected: NovaBank uses SQLite and does not require Docker.\n' +
        '     To install Docker: https://docs.docker.com/get-docker/'
      );
    }
  });

  it('Docker CLI is available', (ctx) => {
    if (!commandAvailable('docker')) {
      console.info('  ℹ  Docker CLI not found — skipping (not required for NovaBank)');
      ctx.skip();
    }
    const result = spawnSync('docker', ['--version'], { shell: true, stdio: 'pipe' });
    expect(result.status, 'Docker CLI returned non-zero exit code').toBe(0);
  });

  it('Docker daemon is reachable', (ctx) => {
    if (!dockerAvailable) {
      console.info('  ℹ  Docker daemon not reachable — skipping (not required for NovaBank)');
      ctx.skip();
    }
    const result = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
      shell: true, stdio: 'pipe', timeout: 3000,
    });
    expect(result.status, 'Docker daemon is not running. Start it and retry.').toBe(0);
  });
});

// ─── 4. Port connectivity ────────────────────────────────────────────────────

describe('4. Port connectivity', () => {
  let backendOpen = false;
  let frontendOpen = false;

  beforeAll(async () => {
    [backendOpen, frontendOpen] = await Promise.all([
      checkPort('127.0.0.1', BACKEND_PORT),
      checkPort('127.0.0.1', FRONTEND_PORT),
    ]);

    if (!backendOpen) {
      console.info(
        `\n  ℹ  Backend port ${BACKEND_PORT} is not open — live port/API/health tests will be skipped.\n` +
        `     Start the backend: cd backend && npm run dev`
      );
    }
    if (!frontendOpen) {
      console.info(
        `\n  ℹ  Frontend port ${FRONTEND_PORT} is not open — frontend server tests will be skipped.\n` +
        `     Start the frontend: cd frontend && npm run dev`
      );
    }
  });

  it(`backend port ${BACKEND_PORT} is accepting connections`, (ctx) => {
    if (!backendOpen) ctx.skip();
    expect(backendOpen, `Port ${BACKEND_PORT} is not accepting connections. Start: cd backend && npm run dev`).toBe(true);
  });

  it(`frontend port ${FRONTEND_PORT} is accepting connections`, (ctx) => {
    if (!frontendOpen) ctx.skip();
    expect(frontendOpen, `Port ${FRONTEND_PORT} is not accepting connections. Start: cd frontend && npm run dev`).toBe(true);
  });
});

// ─── 5. Database connectivity ────────────────────────────────────────────────

describe('5. Database connectivity', () => {
  const dbPath = path.join(BACKEND_DIR, 'novabank.db');

  it('SQLite database file exists', () => {
    expect(
      fs.existsSync(dbPath),
      `Database file not found at backend/novabank.db.\n` +
      `  Seed it with: cd backend && node src/db/schema.js`
    ).toBe(true);
  });

  it('SQLite database file is readable', () => {
    if (!fs.existsSync(dbPath)) return;
    let canRead = false;
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      canRead = true;
    } catch {
      canRead = false;
    }
    expect(
      canRead,
      `Database file exists but is not readable. Check file permissions on backend/novabank.db`
    ).toBe(true);
  });

  it('SQLite database contains expected tables', () => {
    if (!fs.existsSync(dbPath)) return;
    let db;
    try {
      const Database = require(path.join(BACKEND_DIR, 'node_modules', 'better-sqlite3'));
      db = new Database(dbPath, { readonly: true });
    } catch {
      console.info('  ℹ  Could not load better-sqlite3 for table validation — skipping detailed check');
      return;
    }
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(r => r.name);
    db.close();
    const required = ['users', 'transactions', 'payees', 'bills', 'fixed_deposits', 'notifications'];
    for (const table of required) {
      expect(
        tables,
        `Table "${table}" is missing from the database. Re-seed: cd backend && node src/db/schema.js`
      ).toContain(table);
    }
  });
});

// ─── 6. Cache / Redis connectivity ───────────────────────────────────────────

describe('6. Cache / Redis connectivity', () => {
  let redisOpen = false;

  beforeAll(async () => {
    redisOpen = await checkPort('127.0.0.1', 6379);
  });

  it('Redis status is acknowledged (not required for NovaBank)', (ctx) => {
    if (!redisOpen) {
      console.info(
        '  ℹ  Redis is not running on port 6379 — skipping (NovaBank uses SQLite, Redis not required).\n' +
        '     To start Redis if needed: docker run -p 6379:6379 redis:alpine'
      );
      ctx.skip();
    }
    expect(redisOpen).toBe(true);
  });
});

// ─── 7. API health ───────────────────────────────────────────────────────────

describe('7. API health', () => {
  let backendOpen = false;

  beforeAll(async () => {
    backendOpen = await checkPort('127.0.0.1', BACKEND_PORT);
  });

  it('GET /api/health returns { status: "ok" }', async (ctx) => {
    if (!backendOpen) {
      console.info('  ℹ  Backend is not running — API health check skipped. Start: cd backend && npm run dev');
      ctx.skip();
    }
    const { statusCode, body } = await httpGet(`http://localhost:${BACKEND_PORT}/api/health`);
    expect(statusCode, `Expected HTTP 200 from /api/health, got ${statusCode}. Is the backend running?`).toBe(200);
    const json = JSON.parse(body);
    expect(json.status, `Expected { status: "ok" } from /api/health, got: ${body}`).toBe('ok');
    expect(json.name).toBe('NovaBank API');
  });

  it('GET /api/auth/register returns 400 on bad payload (not 404)', async (ctx) => {
    if (!backendOpen) { ctx.skip(); }
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({});
      const req = http.request(
        { hostname: 'localhost', port: BACKEND_PORT, path: '/api/auth/register', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    expect(
      response.statusCode,
      `Expected 400 (validation error) from /api/auth/register with empty body, got ${response.statusCode}. Route may not be mounted correctly.`
    ).toBe(400);
  });
});

// ─── 8. Frontend dev server ──────────────────────────────────────────────────

describe('8. Frontend dev server', () => {
  let frontendOpen = false;

  beforeAll(async () => {
    frontendOpen = await checkPort('127.0.0.1', FRONTEND_PORT);
  });

  it(`Vite dev server is running on port ${FRONTEND_PORT}`, (ctx) => {
    if (!frontendOpen) {
      console.info(`  ℹ  Vite dev server not running — skipped. Start: cd frontend && npm run dev`);
      ctx.skip();
    }
    expect(frontendOpen, `Port ${FRONTEND_PORT} not open. Start Vite: cd frontend && npm run dev`).toBe(true);
  });

  it('Vite dev server responds with HTTP 200', async (ctx) => {
    if (!frontendOpen) { ctx.skip(); }
    const { statusCode } = await httpGet(`http://localhost:${FRONTEND_PORT}`);
    expect(
      statusCode,
      `Vite dev server on port ${FRONTEND_PORT} returned ${statusCode} instead of 200. Check for startup errors.`
    ).toBe(200);
  });
});

// ─── 9. Cross-service config consistency ─────────────────────────────────────

describe('9. Cross-service config consistency', () => {
  it('vite.config.js proxy target points to backend port 3000', () => {
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.js');
    expect(fs.existsSync(viteConfigPath), 'frontend/vite.config.js is missing').toBe(true);
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    expect(
      content,
      `vite.config.js proxy target does not reference port ${BACKEND_PORT}. ` +
      `Update the proxy in vite.config.js to point to http://localhost:${BACKEND_PORT}`
    ).toContain(`${BACKEND_PORT}`);
  });

  it('backend src/index.js default PORT matches expected backend port', () => {
    const indexPath = path.join(BACKEND_DIR, 'src', 'index.js');
    expect(fs.existsSync(indexPath), 'backend/src/index.js is missing').toBe(true);
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(
      content,
      `backend/src/index.js does not reference port ${BACKEND_PORT} as the default. ` +
      `Ensure PORT defaults to ${BACKEND_PORT}: const PORT = process.env.PORT || ${BACKEND_PORT};`
    ).toContain(`${BACKEND_PORT}`);
  });

  it('playwright.config.js baseURL port matches frontend Vite port', () => {
    const playwrightConfigPath = path.join(ROOT, 'playwright.config.js');
    expect(fs.existsSync(playwrightConfigPath), 'playwright.config.js is missing at project root').toBe(true);
    const content = fs.readFileSync(playwrightConfigPath, 'utf8');

    const match = content.match(/baseURL:\s*['"`]http:\/\/localhost:(\d+)['"`]/);
    expect(
      match,
      'playwright.config.js does not have a recognisable baseURL with localhost port. ' +
      "Add: baseURL: 'http://localhost:5174'"
    ).not.toBeNull();

    const playwrightPort = parseInt(match[1], 10);
    if (playwrightPort !== FRONTEND_PORT) {
      console.warn(
        `\n  ⚠  CONFIG MISMATCH DETECTED:\n` +
        `     playwright.config.js baseURL uses port ${playwrightPort}\n` +
        `     vite.config.js server port is          ${FRONTEND_PORT}\n` +
        `     Playwright E2E tests will fail unless both use the same port.\n` +
        `     Fix: update playwright.config.js baseURL to http://localhost:${FRONTEND_PORT}`
      );
    }
    // We flag the mismatch as a warning but fail the test so it is actionable.
    expect(
      playwrightPort,
      `playwright.config.js baseURL uses port ${playwrightPort} but Vite runs on ${FRONTEND_PORT}. ` +
      `Update playwright.config.js: baseURL: 'http://localhost:${FRONTEND_PORT}'`
    ).toBe(FRONTEND_PORT);
  });

  it('frontend API client base URL aligns with vite proxy configuration', () => {
    const clientFiles = [
      path.join(FRONTEND_DIR, 'src', 'api', 'client.js'),
      path.join(FRONTEND_DIR, 'src', 'api', 'client.ts'),
      path.join(FRONTEND_DIR, 'src', 'lib', 'api.js'),
    ];
    const clientPath = clientFiles.find((f) => fs.existsSync(f));
    expect(
      clientPath,
      'Could not find frontend API client file (expected src/api/client.js). ' +
      'Ensure the API client is defined and uses a relative /api base URL so Vite can proxy it.'
    ).toBeDefined();

    const content = fs.readFileSync(clientPath, 'utf8');
    // The API client should use a relative path (/api) or the proxy-aware baseURL,
    // NOT a hardcoded http://localhost:3000 (which would bypass the Vite proxy in production builds).
    const hasAbsoluteHardcode = /baseURL:\s*['"`]http:\/\/localhost:\d+['"`]/.test(content);
    if (hasAbsoluteHardcode) {
      console.warn(
        '  ⚠  API client uses a hardcoded absolute URL (http://localhost:...) rather than a relative /api path.\n' +
        '     This bypasses the Vite proxy and will break in deployed environments.\n' +
        '     Consider changing baseURL to "/api" and letting vite.config.js proxy to http://localhost:3000.'
      );
    }
    // Must reference /api in some form
    expect(
      content,
      'Frontend API client does not reference "/api". ' +
      "Set baseURL to '/api' to use Vite's proxy for local dev."
    ).toMatch(/\/api/);
  });
});
