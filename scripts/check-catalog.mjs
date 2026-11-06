#!/usr/bin/env node
// The skills must stay MECE against the server's tool catalog (tools.json):
// every tool has exactly one owner skill that names it, and no skill or README names a tool the server does not serve.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const KINDS = new Set(['read', 'write', 'destructive', 'account']);
const { tools } = JSON.parse(readFileSync(join(root, 'tools.json'), 'utf8'));
const skills = Object.fromEntries(
  readdirSync(join(root, 'skills')).map((name) => [name, readFileSync(join(root, 'skills', name, 'SKILL.md'), 'utf8')]),
);
const named = (text) => new Set(text.match(/pulpo_[a-z0-9_]+/g) ?? []);

const problems = [];
const catalog = new Map();
for (const tool of tools) {
  if (catalog.has(tool.name)) problems.push(`${tool.name} is listed twice in tools.json`);
  if (!KINDS.has(tool.kind)) problems.push(`${tool.name} has unknown kind "${tool.kind}"`);
  if (!(tool.owner in skills)) problems.push(`${tool.name} is owned by "${tool.owner}", which is not a skill`);
  else if (!named(skills[tool.owner]).has(tool.name)) problems.push(`${tool.name}: its owner skill ${tool.owner} never names it`);
  catalog.set(tool.name, tool);
}
const sources = { ...Object.fromEntries(Object.entries(skills).map(([k, v]) => [`skills/${k}`, v])), 'README.md': readFileSync(join(root, 'README.md'), 'utf8') };
for (const [file, text] of Object.entries(sources)) {
  for (const name of named(text)) if (!catalog.has(name)) problems.push(`${file} names ${name}, which the server does not serve`);
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
const owners = Object.keys(skills).map((s) => `${s} ${[...catalog.values()].filter((t) => t.owner === s).length}`).join(', ');
console.log(`✓ ${catalog.size} tools, each owned by one skill (${owners}); every name in the skills and README is served.`);
