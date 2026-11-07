import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const launch = new URL('launch/', root);
const read = (path) => readFileSync(new URL(path, launch), 'utf8');
const json = (path) => JSON.parse(read(path));
const toolNames = (source) => [...source.matchAll(/\bpulpo_[a-z0-9_]+\b/g)].map(([name]) => name);
const sorted = (entries) => [...entries].sort();
const hints = ['readOnlyHint', 'destructiveHint', 'openWorldHint'];

const { tools } = json('tools.json');
const expected = new Map(tools.map((tool) => [tool.name, tool]));
const broadCatalog = JSON.parse(readFileSync(new URL('tools.json', root), 'utf8'));
const broadNames = new Set(broadCatalog.tools.map(({ name }) => name));
assert.equal(tools.length, 7);
assert.equal(expected.size, tools.length);

const skills = sorted(readdirSync(new URL('skills/', launch)));
assert.deepEqual(skills, sorted(new Set(tools.map(({ owner }) => owner))));
for (const skill of skills) {
  const document = read('skills/' + skill + '/SKILL.md');
  assert(document.startsWith('---\nname: ' + skill + '\n'));
  assert.deepEqual(sorted(new Set(toolNames(document))),
    sorted(tools.filter(({ owner }) => owner === skill).map(({ name }) => name)));
}
for (const tool of tools) {
  assert(broadNames.has(tool.name), tool.name);
  assert(tool.title.length > 0, tool.name);
  assert.deepEqual(sorted(Object.keys(tool.annotations)), sorted(hints), tool.name);
  assert.equal(tool.annotations.readOnlyHint, tool.name !== 'pulpo_select_account', tool.name);
  assert.equal(tool.annotations.destructiveHint, false, tool.name);
  assert.equal(tool.annotations.openWorldHint, false, tool.name);
}

const agent = json('plugin.json');
const codex = json('.codex-plugin/plugin.json');
const claude = json('.claude-plugin/plugin.json');
for (const manifest of [codex, claude]) {
  assert.equal(manifest.name, agent.name);
  assert.equal(manifest.version, agent.version);
  assert.equal(manifest.skills, './skills/');
}
assert.equal(codex.mcpServers, './.mcp.json');

for (const [file, type] of [['.mcp.json', 'http'], ['mcp.json', 'streamable-http']]) {
  const { mcpServers } = json(file);
  assert.deepEqual(Object.keys(mcpServers), ['pulpo-fleet']);
  assert.deepEqual(mcpServers['pulpo-fleet'], {
    type,
    url: 'https://eu1.getpulpo.com/mcp',
  });
}

const { interface: metadata, review } = agent.extensions['com.openai'];
for (const listing of [metadata, codex.interface]) {
  assert(listing.capabilities.includes('Read'));
  assert(!listing.capabilities.includes('Write'));
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    const url = new URL(listing[key]);
    assert.equal(url.protocol, 'https:');
    assert(!url.username && !url.password);
  }
  for (const key of ['logo', 'composerIcon']) {
    const localPath = listing[key];
    assert.equal(localPath, './assets/logo.png');
    assert(statSync(new URL(localPath, launch)).isFile());
  }
}
const { positive, negative } = review.test_cases;
assert.equal(positive.length, 5);
assert.equal(negative.length, 3);
for (const scenario of [...positive, ...negative]) {
  assert(scenario.description && scenario.prompt);
}
const exercised = new Set(positive.flatMap(({ tools_triggered, expected_behavior }) => {
  assert(tools_triggered.length > 0 && expected_behavior);
  return tools_triggered;
}));
assert.deepEqual(sorted(exercised), sorted(expected.keys()));
for (const file of ['README.md', 'plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
  for (const name of toolNames(read(file))) assert(expected.has(name), file + ': ' + name);
}

const discoveryPath = process.argv[2];
if (discoveryPath) {
  const response = JSON.parse(readFileSync(discoveryPath, 'utf8'));
  const advertised = response.result?.tools ?? response.tools;
  assert(Array.isArray(advertised));
  assert.deepEqual(sorted(advertised.map(({ name }) => name)), sorted(expected.keys()));
  for (const tool of advertised) {
    const pinned = expected.get(tool.name);
    assert.equal(tool.title, pinned.title, tool.name);
    for (const hint of hints) {
      assert.equal(tool.annotations?.[hint], pinned.annotations[hint], tool.name + '.' + hint);
    }
    assert.deepEqual(sorted(Object.keys(tool.inputSchema?.properties ?? {})),
      sorted(pinned.inputProperties), tool.name + ' inputs');
  }
}
console.log(JSON.stringify({
  version: agent.version, tools: expected.size, positiveCases: positive.length,
  negativeCases: negative.length, comparedDiscoveryCapture: Boolean(discoveryPath),
  demoRecordingLinked: Boolean(review.demo_recording_url),
}));
