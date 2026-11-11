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

It contains no hooks, scripts, executables or credentials, and it does not read your environment or files.

## Install

**Claude Code**

```
/plugin marketplace add pulpomatic/pulpo-fleet-plugin
/plugin install pulpo-fleet@pulpo
```

Then run any Pulpo question; Claude opens the Pulpo sign-in the first time. On Claude web (claude.ai) and the desktop app, add Pulpo Fleet as a custom connector (**Settings → Connectors → Add custom connector**: `https://eu1.getpulpo.com/mcp`). The custom connector receives all tools and server instructions directly; bundled skills are loaded when using Claude Code or Codex. [Claude custom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)

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
- **Confirmation.** The bundled skills (and server instructions for direct connectors) tell the assistant to show each change and wait for your explicit yes before writing, and to say plainly that deletes, archives and money movements cannot be undone. For writes other than money the server itself does not ask: your client may also ask before running tools it marks as destructive, and a client set to auto-approve removes that check. If you do not want any writes, leave tool approval on, or deny the write tools in your client.
- **Money needs your approval.** The server never moves money when the assistant calls a money tool: it builds a preview from your current balances (cards, amounts, totals, balances before and after). In Claude (web and desktop) you approve it in Pulpo's approval card, and only your click there counts; client auto-approval does not. In Claude Code, Codex and other clients, for now, the approval is your client's prompt to allow `pulpo_apply_change`: a client set to auto-approve or bypass skips that prompt, so keep tool approval on for it. A link to approve in Pulpo will replace this.
- **Limits you should know.** The assistant never gets your Pulpo password. Changing a vehicle's plate, VIN, brand, model or year takes two calls: the first only shows the current and new values, and nothing is written until the second, confirmed one. Administrators and roles cannot be changed through this plugin; use Pulpo. Lists come in bounded pages, so very large fleets are summarized from the first pages unless you narrow the question.
- **Where it connects.** The only network connection is to Pulpo's MCP server at `eu1.getpulpo.com`, operated by Pulpo.

## Support and legal

- Support: <https://www.getpulpo.com/contacto>
- Privacy policy: <https://www.getpulpo.com/politicas-de-cookies-y-privacidad>
- Terms: <https://www.getpulpo.com/terminos-y-condiciones>

## Source

Maintained by Pulpo. The tools themselves are served by Pulpo's MCP server, so they update without a new plugin release; this repository holds only the connection and the skills. `tools.json` lists every tool the server serves and the one skill that owns it; `node scripts/check-catalog.mjs` (run in CI on every pull request) fails when a skill names a tool the server does not serve or a tool has no owner. Refresh `tools.json` when the server's catalog changes. Licensed under MIT, see `LICENSE`.
