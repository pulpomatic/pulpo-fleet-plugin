# Pulpo Fleet

Pulpo Fleet connects [Pulpo](https://www.getpulpo.com/) to Claude (Claude Code and claude.ai) and Codex. Ask about your fleet in plain language, and, when you want, make changes to it: vehicles and their status, insurance and contracts, drivers and assignments, fuel loads and expenses, maintenance and reminders, inspections, and PulpoPay cards, balances and funding requests.

It acts with your own Pulpo permissions. The assistant sees and changes only what your role, your segments and the account you pick allow in Pulpo.

## What this plugin contains

- A connection to Pulpo's remote MCP server, `https://eu1.getpulpo.com/mcp` (Streamable HTTP), declared in `.mcp.json` (Claude and Codex) and `mcp.json` (Agent Plugins / OpenAI directory). The server serves the tools of Pulpo's fleet agent as `pulpo_*` tools, plus `pulpo_list_accounts` and `pulpo_select_account` for users who belong to several accounts.
- Eight skills in `skills/` that teach the assistant how to use those tools well:

| Skill | For |
| --- | --- |
| `getting-started` | Choosing the account, which skill covers what, how to read and write safely, suppliers, segments, tags, catalogs, traffic fines, how-to questions, support |
| `fleet-overview` | Fleet size, health score, missing data, what needs attention |
| `vehicles` | Finding vehicles, details, status, contracts, insurance, odometer, creating, archiving |
| `maintenance-reminders` | Work orders, maintenance plans, reminders and due dates |
| `fuel-expenses` | Fuel loads, expenses, approvals, cost summaries |
| `drivers-assignments` | Drivers, licenses, documents, vehicle and card assignments |
| `pulpopay` | PulpoPay balances, cards, movements, funding requests, with stricter rules for money |
| `inspections` | Checklist forms and recorded vehicle inspections |

It contains no hooks or credentials, and it does not read your environment or files. `scripts/` and `evals/` are development tools that install with the plugin but never run when it is used.

## Install

**Claude Code and the Claude desktop app: paste this prompt**

Open Claude Code, or the Code tab of the desktop app, and paste:

> Install the Pulpo Fleet plugin for Claude. Run these two commands, one after the other:
> `claude plugin marketplace add pulpomatic/pulpo-fleet-plugin`
> `claude plugin install pulpo-fleet@pulpo`
> If either one fails, show me the error as it is and do not try anything else. When both finish, tell me to restart Claude. After the restart, my first question about Pulpo will ask me to sign in with my Pulpo user.

En español:

> Instala el plugin Pulpo Fleet para Claude. Ejecuta estos dos comandos, uno detrás de otro:
> `claude plugin marketplace add pulpomatic/pulpo-fleet-plugin`
> `claude plugin install pulpo-fleet@pulpo`
> Si alguno falla, enséñame el error tal cual y no intentes otra cosa. Cuando terminen, dime que reinicie Claude. Después de reiniciar, mi primera pregunta sobre Pulpo me pedirá iniciar sesión con mi usuario de Pulpo.

Claude asks you to allow each command before it runs. To type them yourself instead, in Claude Code:

```
/plugin marketplace add pulpomatic/pulpo-fleet-plugin
/plugin install pulpo-fleet@pulpo
```

The first Pulpo question opens the Pulpo sign-in. The desktop app then lists Pulpo Fleet with its eight skills and its connector.

**Claude web (claude.ai), without the plugin**

A chat on claude.ai cannot run commands, so add the server as a custom connector: **Settings → Connectors → Add custom connector**, URL `https://eu1.getpulpo.com/mcp`, and for sign-in choose **Use Claude's published identity**. Without that choice Claude has no way to start the Pulpo sign-in and never shows Connect. On Claude Team and Enterprise an owner adds it once for the organization; then each person connects their own Pulpo user. The connector gets every tool and the server's instructions, not the skills. [Claude custom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)

**Codex**

```
codex plugin marketplace add pulpomatic/pulpo-fleet-plugin
codex plugin add pulpo-fleet@pulpo
codex mcp add pulpo-fleet --url https://eu1.getpulpo.com/mcp
```

The last command signs you in to Pulpo. Run it even though the plugin already declares the server: Codex (checked with 0.166) exposes only part of the server's tools when the server comes from a plugin, and the entry with the same name makes it load all of them. The plugin still provides the skills.

Nothing needs to be configured: sign-in is OAuth through Pulpo's identity provider (Auth0), with no client secret and no API key to copy.

## Data and privacy

- **What it reads.** On each tool call the assistant sends the tool's arguments (for example a plate, a date range or a record id) to Pulpo and receives records from your Pulpo account: vehicles, drivers and their licenses, fuel and expense records, maintenance, reminders, inspections, payment methods, and PulpoPay balances, cards (masked numbers) and movements. That content enters the conversation with your AI assistant and is handled under that product's own terms.
- **What it writes.** It can create, edit, approve, assign, archive and delete records, and can move money between PulpoPay accounts and cards, using the same permissions you have in Pulpo. Every write is performed with your own credentials and permissions.
- **Every write needs your approval.** The server never writes when the assistant calls a write tool. It builds a preview from your current data (each record as you know it, each field's current and new value, whether it moves real money or notifies someone, and whether and how it can be undone), and the assistant shows it to you. For money the preview also shows who receives it, by name and last four digits, amounts, row count and total, and balances before and after. You approve it when your client asks you to allow `pulpo_apply_change`: that prompt shows the change in one line, the row count and, for money, the total, and the server refuses the call if they are not the ones you were shown. For the tools with their own preview (vehicles, drivers, assignments, cards, fuel, expenses, suppliers, reminders, maintenance, money) it also refuses if the record changed since you saw it; for the rest, which show the change as the assistant sends it, there is no record to compare and the preview says it cannot be undone automatically.
- **Undo.** The server keeps a journal of your changes for 90 days. Ask the assistant to list them (`pulpo_list_my_changes`) or to undo one (`pulpo_undo_change`): it writes the previous values back, removes what was created, or moves money back while it is still on the card, as a new change you approve. It refuses rather than overwrite a record someone changed since, removes a created record only while nothing was added to it, moves money back only while the card holds it, and says which changes cannot be undone (deletes, messages sent, money spent). This is how it works in every client today. If Pulpo enables an in-chat approval card for a client, that client says so with the preview, and your click in the card is the approval instead. A client set to "always allow" or to an auto-approve or bypass mode skips the prompt, so keep tool approval on for `pulpo_apply_change`. A link to approve in Pulpo will replace the prompt.
- **Limits you should know.** The assistant never gets your Pulpo password. Changing a vehicle's plate, VIN, brand, model or year shows Pulpo's own check of the current and new values first, like every change. Administrators and roles cannot be changed through this plugin; use Pulpo. Lists come in bounded pages, so very large fleets are summarized from the first pages unless you narrow the question.
- **Where it connects.** The only network connection is to Pulpo's MCP server at `eu1.getpulpo.com`, operated by Pulpo.

## Support and legal

- Support: <https://www.getpulpo.com/contacto>
- Privacy policy: <https://www.getpulpo.com/politicas-de-cookies-y-privacidad>
- Terms: <https://www.getpulpo.com/terminos-y-condiciones>

## Evals

`evals/` holds a suite for `claude plugin eval` that measures what the skills add over the connector alone: each case is a real request (in Spanish, as users write), answered against mocks of the server: every one of its tools, with its real description and schema (`evals/mocks/pulpo-fleet/_tools.json`, the server's `tools/list`), answers with the case's mock or a default one (an empty page for a read, a generic proposal for a write; `scripts/eval-default-mocks.mjs`; the six exports are left out because the eval caps a server at 256 mocks), and the server's real instructions go in the system prompt (`evals/connector-instructions.md`). Graders check which tools are called and never called (no `pulpo_apply_change` without a yes, no money tool after an instruction hidden in a record, no deleted driver) and a model judges the reply against one criterion per grader.

```bash
scripts/eval-compare.sh --runs 3
```

runs the suite twice, with the skills and with the same plugin without them, and prints both scores per case. It needs Claude Code signed in and costs a few dollars per run of the whole suite. `claude plugin eval` serves only the tools that have a mock, so a "never called" grader on an unmocked or misspelled tool always passes: CI runs `node scripts/eval-default-mocks.mjs` (every tool has a mock) and `node scripts/check-evals.mjs` (the mocked catalog matches `tools.json`, and every grader and mock names a served tool). After changing `evals/connector-instructions.md`, run `node scripts/eval-instructions.mjs --write`.

## Source

Maintained by Pulpo. The tools themselves are served by Pulpo's MCP server, so they update without a new plugin release; this repository holds only the connection and the skills. `tools.json` lists every tool the server serves and the one skill that owns it; `node scripts/check-catalog.mjs` (run in CI on every pull request) fails when a skill names a tool the server does not serve or a tool has no owner. Refresh `tools.json` when the server's catalog changes. Licensed under MIT, see `LICENSE`.
