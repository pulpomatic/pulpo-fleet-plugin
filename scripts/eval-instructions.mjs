#!/usr/bin/env node
// Eval mocks do not carry the MCP server's instructions, which the real connector sends on initialize. Every case gets them
// in its system prompt instead, from one file: evals/connector-instructions.md (dumped from the server's tools/list and
// initialize). `--write` updates the cases; without it, exits 1 when a case is out of date (CI).
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const evals = fileURLToPath(new URL('../evals/', import.meta.url));
const TODAY = '2026-11-11';
const instructions = readFileSync(join(evals, 'connector-instructions.md'), 'utf8').trim();
const block = [
  `The MCP server "pulpo-fleet" sent these instructions:`,
  '',
  ...instructions.split("\n"),
  '',
  `Today is ${TODAY}. The user is in Mexico (America/Mexico_City).`,
];
const yaml = ['append_system_prompt: |', ...block.map((line) => (line ? `  ${line}` : ''))].join('\n');

const stale = [];
for (const name of readdirSync(evals)) {
  const file = join(evals, name, 'prompt.md');
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const [, front, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (front === undefined) throw new Error(`${file}: no frontmatter`);
  const lines = front.split('\n');
  const start = lines.indexOf('append_system_prompt: |');
  let end = start + 1;
  if (start >= 0) while (end < lines.length && (lines[end] === '' || lines[end].startsWith('  '))) end += 1;
  const kept = (start >= 0 ? [...lines.slice(0, start), ...lines.slice(end)] : lines).join('\n').trimEnd();
  const next = `---\n${kept}\n${yaml}\n---\n${body}`;
  if (next !== text) stale.push(name);
  if (process.argv.includes('--write')) writeFileSync(file, next);
}
if (stale.length && !process.argv.includes('--write')) {
  console.error(`✗ out of date (run node scripts/eval-instructions.mjs --write): ${stale.join(', ')}`);
  process.exit(1);
}
console.log(process.argv.includes('--write') ? `updated ${stale.length} case(s)` : '✓ every case carries the connector instructions');
