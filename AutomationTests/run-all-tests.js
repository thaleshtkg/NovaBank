/**
 * NovaBank — Master Test Runner
 * Runs every test suite stage by stage from the project root.
 *
 * Usage:
 *   node AutomationTests/run-all-tests.js
 *   node AutomationTests/run-all-tests.js --stop-on-failure
 *   node AutomationTests/run-all-tests.js --skip-infra
 *   node AutomationTests/run-all-tests.js --skip-browser
 *   node AutomationTests/run-all-tests.js --stages 1,2,10,14
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

// On Windows, npm must be invoked as "npm.cmd"
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = {
  reset:  isTTY ? '\x1b[0m'  : '',
  bold:   isTTY ? '\x1b[1m'  : '',
  red:    isTTY ? '\x1b[31m' : '',
  green:  isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan:   isTTY ? '\x1b[36m' : '',
};

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGES = [
  // ── Infrastructure pre-flights (stages 1–9) ───────────────────────────────
  { id: 1,  group: 'Infrastructure', name: 'System Requirements',       cwd: ROOT,                      script: 'test:infra:system'      },
  { id: 2,  group: 'Infrastructure', name: 'Environment Config',        cwd: ROOT,                      script: 'test:infra:env'         },
  { id: 3,  group: 'Infrastructure', name: 'Docker Services',           cwd: ROOT,                      script: 'test:infra:docker'      },
  { id: 4,  group: 'Infrastructure', name: 'Port Connectivity',         cwd: ROOT,                      script: 'test:infra:ports'       },
  { id: 5,  group: 'Infrastructure', name: 'Database Connectivity',     cwd: ROOT,                      script: 'test:infra:db'          },
  { id: 6,  group: 'Infrastructure', name: 'Cache / Redis',             cwd: ROOT,                      script: 'test:infra:redis'       },
  { id: 7,  group: 'Infrastructure', name: 'API Health',                cwd: ROOT,                      script: 'test:infra:api'         },
  { id: 8,  group: 'Infrastructure', name: 'Frontend Dev Server',       cwd: ROOT,                      script: 'test:infra:frontend'    },
  { id: 9,  group: 'Infrastructure', name: 'Cross-Service Consistency', cwd: ROOT,                      script: 'test:infra:consistency' },
  // ── Backend (stages 10–13) ────────────────────────────────────────────────
  { id: 10, group: 'Backend',        name: 'Unit Tests',                cwd: resolve(ROOT, 'backend'),  script: 'test:unit'              },
  { id: 11, group: 'Backend',        name: 'Smoke Tests',               cwd: resolve(ROOT, 'backend'),  script: 'test:smoke'             },
  { id: 12, group: 'Backend',        name: 'Integration (RealDB)',      cwd: resolve(ROOT, 'backend'),  script: 'test:integration'       },
  { id: 13, group: 'Backend',        name: 'E2E API (Full Journey)',    cwd: resolve(ROOT, 'backend'),  script: 'test:e2e'               },
  // ── Frontend (stages 14–17) ───────────────────────────────────────────────
  { id: 14, group: 'Frontend',       name: 'Unit Tests (Utils)',        cwd: resolve(ROOT, 'frontend'), script: 'test:unit'              },
  { id: 15, group: 'Frontend',       name: 'Component Tests',           cwd: resolve(ROOT, 'frontend'), script: 'test:components'        },
  { id: 16, group: 'Frontend',       name: 'Page Tests',                cwd: resolve(ROOT, 'frontend'), script: 'test:pages'             },
  { id: 17, group: 'Frontend',       name: 'Context Tests',             cwd: resolve(ROOT, 'frontend'), script: 'test:context'           },
  // ── Browser E2E (stage 18) — requires live backend + frontend servers ─────
  { id: 18, group: 'Browser E2E',    name: 'Playwright Browser Tests',  cwd: ROOT,                      script: 'test:e2e', skip: true   },
];

// ── CLI flag parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const stopOnFailure = args.includes('--stop-on-failure');
const skipInfra     = args.includes('--skip-infra');
const skipBrowser   = args.includes('--skip-browser');

let stageFilter = null;
const stagesFlag = args.find(a => a.startsWith('--stages'));
if (stagesFlag) {
  const raw = stagesFlag.includes('=')
    ? stagesFlag.split('=')[1]
    : args[args.indexOf('--stages') + 1];
  stageFilter = new Set(raw.split(',').map(n => parseInt(n.trim())).filter(Boolean));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function divider(char = '─', width = 78) {
  return char.repeat(width);
}

function formatDuration(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function runStage(stage) {
  const start  = Date.now();
  const result = spawnSync(NPM, ['run', stage.script], {
    cwd:   stage.cwd,
    stdio: 'inherit',
    shell: false,
  });
  const elapsed = Date.now() - start;
  const passed  = result.status === 0;
  return { passed, elapsed, exitCode: result.status };
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${c.cyan}${c.bold}${'═'.repeat(78)}${c.reset}`);
console.log(`${c.cyan}${c.bold}  NOVABANK — MASTER TEST RUNNER${c.reset}`);
console.log(`${c.cyan}${c.bold}${'═'.repeat(78)}${c.reset}\n`);

const results   = [];
let anyFailed   = false;

for (const stage of STAGES) {
  // Apply filters
  if (stageFilter && !stageFilter.has(stage.id)) continue;
  if (skipInfra   && stage.group === 'Infrastructure') continue;
  if (skipBrowser && stage.group === 'Browser E2E')   continue;

  if (stage.skip && !stageFilter?.has(stage.id)) {
    console.log(
      `${c.yellow}  ⊘  Stage ${stage.id}/${STAGES.length} — ${stage.name}` +
      ` (SKIPPED — requires live backend + frontend servers)${c.reset}\n`
    );
    results.push({ ...stage, passed: null, elapsed: 0, skipped: true });
    continue;
  }

  console.log(`${c.yellow}${divider()}${c.reset}`);
  console.log(`${c.bold}  Stage ${stage.id}/${STAGES.length} — ${stage.group}: ${stage.name}${c.reset}`);
  console.log(`  Command : npm run ${stage.script}`);
  console.log(`  Cwd     : ${stage.cwd}`);
  console.log(`${c.yellow}${divider()}${c.reset}\n`);

  const { passed, elapsed, exitCode } = runStage(stage);

  if (passed) {
    console.log(`\n${c.green}  ✅ PASSED${c.reset}  (${formatDuration(elapsed)})\n`);
  } else {
    console.log(`\n${c.red}  ❌ FAILED${c.reset}  exit code ${exitCode}  (${formatDuration(elapsed)})\n`);
    anyFailed = true;
  }

  results.push({ ...stage, passed, elapsed, skipped: false });

  if (!passed && stopOnFailure) {
    console.log(`${c.red}${c.bold}  Stopping on first failure (--stop-on-failure).${c.reset}\n`);
    break;
  }
}

// ── Summary table ─────────────────────────────────────────────────────────────
console.log(`\n${c.cyan}${c.bold}${'═'.repeat(78)}${c.reset}`);
console.log(`${c.cyan}${c.bold}  SUMMARY${c.reset}`);
console.log(`${c.cyan}${c.bold}${'═'.repeat(78)}${c.reset}\n`);

const COL = { id: 4, group: 16, name: 33, result: 9, time: 8 };
console.log(
  `${c.bold}${pad('#', COL.id)}${pad('Group', COL.group)}${pad('Stage', COL.name)}` +
  `${pad('Result', COL.result)}${pad('Time', COL.time)}${c.reset}`
);
console.log(divider('─', COL.id + COL.group + COL.name + COL.result + COL.time));

let passed = 0, failed = 0, skipped = 0;
const failedStages = [];
let totalElapsed   = 0;

for (const r of results) {
  totalElapsed += r.elapsed;
  let resultStr, resultColor;
  if (r.skipped) {
    skipped++;
    resultStr   = 'SKIP';
    resultColor = c.yellow;
  } else if (r.passed) {
    passed++;
    resultStr   = '✅ PASS';
    resultColor = c.green;
  } else {
    failed++;
    resultStr   = '❌ FAIL';
    resultColor = c.red;
    failedStages.push(r.name);
  }

  console.log(
    `${pad(r.id, COL.id)}${pad(r.group, COL.group)}${pad(r.name, COL.name)}` +
    `${resultColor}${pad(resultStr, COL.result)}${c.reset}${formatDuration(r.elapsed)}`
  );
}

console.log(divider('─', COL.id + COL.group + COL.name + COL.result + COL.time));
console.log(
  `\nPassed ${c.green}${passed}${c.reset}  ` +
  `Failed ${c.red}${failed}${c.reset}  ` +
  `Skipped ${c.yellow}${skipped}${c.reset}  ` +
  `Total time ${formatDuration(totalElapsed)}\n`
);

if (failedStages.length > 0) {
  console.log(`${c.red}${c.bold}Failed stages:${c.reset}`);
  for (const n of failedStages) console.log(`  ${c.red}✗${c.reset} ${n}`);
  console.log('');
}

process.exit(anyFailed ? 1 : 0);
