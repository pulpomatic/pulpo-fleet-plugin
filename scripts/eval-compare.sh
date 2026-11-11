#!/bin/bash
# Measures what the skills add: runs the eval suite against the plugin and against the same plugin without skills (the
# connector alone, as a user who adds only the connector gets it). `claude plugin eval`'s own baseline drops the whole
# plugin, MCP server included, so it would compare against no tools at all.
# Usage: scripts/eval-compare.sh [extra claude plugin eval flags, e.g. --runs 3 --case 'money-*']
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
out=$(mktemp -d); bare="$out/connector-only"
rsync -a --exclude .git --exclude skills --exclude 'evals/results' "$root/" "$bare/"
node -e 'const f=process.argv[1],p=require(f);delete p.skills;require("fs").writeFileSync(f,JSON.stringify(p,null,2))' "$bare/.claude-plugin/plugin.json"
node "$root/scripts/eval-instructions.mjs"
common=(--trust-plugin --ablation none --no-publish --threshold 0 --keep-temp --model "${EVAL_MODEL:-sonnet}" -j "${EVAL_CONCURRENCY:-2}" "$@")
claude plugin eval "$root" "${common[@]}" --json "$out/with-skills.json" >/dev/null 2> >(grep -v "kept /" >&2)
claude plugin eval "$bare" "${common[@]}" --json "$out/connector-only.json" >/dev/null 2> >(grep -v "kept /" >&2)
node - "$out/with-skills.json" "$out/connector-only.json" <<'JS'
const [w, c] = process.argv.slice(2).map((f) => JSON.parse(require('fs').readFileSync(f, 'utf8')));
const by = (r) => Object.fromEntries(r.cases.map((k) => [k.name, k]));
const W = by(w), C = by(c);
const calls = (trace) => {
  try {
    return require('fs').readFileSync(trace, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
      const e = JSON.parse(line);
      return e.type === 'assistant' ? e.message.content.filter((c) => c.type === 'tool_use').map((c) => c.name.replace(/^mcp__plugin_pulpo-fleet_pulpo-fleet__/, '')) : [];
    });
  } catch { return ['(trace not kept)']; }
};
const pct = (x) => (x === undefined ? '  –' : `${Math.round(x * 100)}%`.padStart(4));
console.log(`${'case'.padEnd(24)} skills  connector-only`);
for (const name of Object.keys(W)) {
  console.log(`${name.padEnd(24)} ${pct(W[name].aggregates.score)}    ${pct(C[name]?.aggregates.score)}`);
  for (const run of W[name].arms.with) {
    const failed = run.graders.filter((g) => !g.passed);
    for (const g of failed) console.log(`    ✗ skills: ${g.name}: ${g.explanation.slice(0, 160)}`);
    if (failed.length) console.log(`      calls: ${calls(run.tracePath).join(' → ') || '(none)'}`);
  }
}
console.log(`${'overall'.padEnd(24)} ${pct(w.aggregates.overallScore)}    ${pct(c.aggregates.overallScore)}`);
JS
echo "results: $out"
