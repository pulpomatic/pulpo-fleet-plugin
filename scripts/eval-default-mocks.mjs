#!/usr/bin/env node
// `claude plugin eval` serves only the tools that have a mock, so a case that mocks five tools would show the model five
// tools instead of the server's catalog, and a "never called" grader on an unmocked tool could never fail. Every tool in
// tools.json gets a default suite mock here: reads answer an empty page, writes answer a generic proposal (writes only
// propose; pulpo_apply_change is what runs). Cases override them with their own mocks. A suite mock whose text differs
// from the default is hand-written and kept. `--write` updates; without it, exits 1 when a tool has no mock or a
// default is stale (CI).
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'evals/mocks/pulpo-fleet');
const { tools } = JSON.parse(readFileSync(join(root, 'tools.json'), 'utf8'));
const write = process.argv.includes('--write');

const READ = '{"data": [], "_metadata": {"_total_rows": 0, "_skip": 0, "_take": 10}}\n';
const proposal = (tool) => {
  const apply = JSON.stringify({ approvalId: `apv_${tool.slice('pulpo_'.length)}`, tool, rows: 1, change: `${tool}: 1 record as proposed` });
  return [
    "Nothing has changed yet: this needs the user's approval.",
    `${tool.slice('pulpo_'.length).replaceAll('_', ' ')}`,
    'Only changes Pulpo records.',
    'Rows: 1',
    '1. The record as given: current → new as sent',
    'Cannot be undone automatically: the previous state cannot be written back with this tool.',
    '',
    'Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. ' +
      `Only after a plain yes, call pulpo_apply_change once with exactly ${apply}: their client asks them to allow that call, ` +
      'with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at ' +
      '2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.',
    '',
  ].join('\n');
};
const DEFAULT = { read: () => READ, write: proposal, destructive: proposal };

// The eval caps a server at 256 mock entries (_tools.json included). The exports are left out: they return files, which the
// skills say never to answer from, so a model that reaches for one in a case fails to find it rather than gets a file.
const LEFT_OUT = (name) => name.startsWith('pulpo_export_');
const CAP = 256;

const isDefault = (text) => text === READ || text.startsWith("Nothing has changed yet: this needs the user's approval.\n") && text.includes('1 record as proposed');
const problems = [];
let updated = 0;
for (const { name, kind } of tools) {
  const file = join(dir, `${name}.md`);
  const current = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  if (LEFT_OUT(name)) {
    if (current !== undefined && isDefault(current)) { if (write) { rmSync(file); updated += 1; } else problems.push(`${name}: left out, remove its default`); }
    continue;
  }
  if (current !== undefined && !isDefault(current)) continue; // hand-written
  if (!DEFAULT[kind]) { problems.push(`${name} (${kind}) has no default: write its suite mock by hand`); continue; }
  const next = DEFAULT[kind](name);
  if (current === next) continue;
  if (write) { writeFileSync(file, next); updated += 1; } else problems.push(`${name}: ${current === undefined ? 'no suite mock' : 'stale default'}`);
}
const served = new Set(tools.map((t) => t.name));
for (const file of readdirSync(dir)) if (file.endsWith('.md') && !served.has(file.slice(0, -3))) problems.push(`${file} mocks a tool tools.json does not list`);
const entries = readdirSync(dir).length;
if (entries > CAP) problems.push(`evals/mocks/pulpo-fleet has ${entries} entries; the eval refuses more than ${CAP}`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n') + (write ? '' : '\n(run node scripts/eval-default-mocks.mjs --write)'));
  process.exit(1);
}
console.log(write ? `updated ${updated} default mock(s)` : `✓ every tool but the ${tools.filter((t) => LEFT_OUT(t.name)).length} exports has a suite mock (${entries} of ${CAP} entries)`);
