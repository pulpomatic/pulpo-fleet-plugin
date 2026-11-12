#!/usr/bin/env node
// Static checks of the eval suite, cheap enough for every push:
// 1. evals/mocks/pulpo-fleet/_tools.json (the server's tools/list) serves exactly the tools in tools.json, so the cases see
//    the catalog the skills are written against.
// 2. Every tool a grader or a mock names is one the server serves. A "never called" grader on a misspelled tool passes
//    whatever the model does, so a typo would hide exactly the failure it guards. (That every served tool has a mock, so
//    that it exists in the run at all, is scripts/eval-default-mocks.mjs.)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const evals = join(root, 'evals');
const PREFIX = 'mcp__plugin_pulpo-fleet_pulpo-fleet__';
const served = new Set(JSON.parse(readFileSync(join(evals, 'mocks/pulpo-fleet/_tools.json'), 'utf8')).tools.map((t) => t.name));
const catalog = new Set(JSON.parse(readFileSync(join(root, 'tools.json'), 'utf8')).tools.map((t) => t.name));

/** The flat `key: value` lines of a file's frontmatter, values trimmed and unquoted (graders here use no nesting). */
const frontmatter = (text) => {
  const block = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (block === undefined) return undefined;
  return Object.fromEntries(block.split('\n').map((line) => line.match(/^([a-z_]+):(.*)$/)).filter(Boolean)
    .map(([, key, value]) => [key, value.trim().replace(/^(['"])(.*)\1$/, '$2')]));
};

const problems = [];
for (const name of catalog) if (!served.has(name)) problems.push(`tools.json has ${name}, the eval tools/list does not`);
for (const name of served) if (!catalog.has(name)) problems.push(`the eval tools/list has ${name}, tools.json does not`);

const mockDirs = [join(evals, 'mocks/pulpo-fleet')];
for (const name of readdirSync(evals)) {
  const graders = join(evals, name, 'graders');
  if (existsSync(graders)) {
    for (const file of readdirSync(graders)) {
      const front = frontmatter(readFileSync(join(graders, file), 'utf8'));
      const where = `${name}/${file}`;
      if (front === undefined) { problems.push(`${where}: no frontmatter`); continue; }
      const tools = front.type === 'tool_used' ? [front.tool] : front.type === 'tool_order' ? [front.before, front.after] : [];
      for (const tool of tools) {
        if (!tool) { problems.push(`${where}: ${front.type} without a tool`); continue; }
        if (tool === 'Skill') continue;
        if (!tool.startsWith(PREFIX)) { problems.push(`${where}: ${tool} is not a ${PREFIX}* tool`); continue; }
        if (!served.has(tool.slice(PREFIX.length))) problems.push(`${where}: ${tool.slice(PREFIX.length)} is not served`);
      }
    }
  }
  if (existsSync(join(evals, name, 'mocks/pulpo-fleet'))) mockDirs.push(join(evals, name, 'mocks/pulpo-fleet'));
}
for (const dir of mockDirs) {
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    if (!served.has(file.slice(0, -3))) problems.push(`${dir.slice(evals.length + 1)}/${file}: mocks a tool that is not served`);
  }
}
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log(`✓ evals: ${served.size} tools match tools.json; every grader and mock names a served tool`);
