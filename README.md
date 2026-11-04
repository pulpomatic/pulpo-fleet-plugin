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

Then run any Pulpo question; Claude opens the Pulpo sign-in the first time. In claude.ai, install Pulpo Fleet from the plugin directory and sign in to Pulpo when prompted.

**Codex**

```
codex plugin marketplace add pulpomatic/pulpo-fleet-plugin
codex plugin add pulpo-fleet@pulpo
```

Then sign in to Pulpo when prompted. The same server can also be added without the skills with `codex mcp add pulpo-fleet --url https://eu1.getpulpo.com/mcp`.

Nothing needs to be configured: sign-in is OAuth through Pulpo's identity provider (Auth0), with no client secret and no API key to copy.

## Data and privacy

- **What it reads.** On each tool call the assistant sends the tool's arguments (for example a plate, a date range or a record id) to Pulpo and receives records from your Pulpo account: vehicles, drivers and their licenses, fuel and expense records, maintenance, reminders, inspections, payment methods, and PulpoPay balances, cards (masked numbers) and movements. That content enters the conversation with your AI assistant and is handled under that product's own terms.
- **What it writes.** It can create, edit, approve, assign, archive and delete records, and can move money between PulpoPay accounts and cards, using the same permissions you have in Pulpo. Every write is performed with your own credentials and permissions.
- **Confirmation.** The bundled skills tell the assistant to show each change and wait for your explicit yes before writing, and to say plainly that deletes, archives and money movements cannot be undone. The server itself does not ask: your client may also ask before running tools it marks as destructive, and a client set to auto-approve removes that check. If you do not want any writes, leave tool approval on, or deny the write tools in your client.
- **Limits you should know.** The assistant never gets your Pulpo password. Changing a vehicle's plate, VIN, brand, model or year takes two calls: the first only shows the current and new values, and nothing is written until the second, confirmed one. Administrators and roles cannot be changed through this plugin; use Pulpo. Lists come in bounded pages, so very large fleets are summarized from the first pages unless you narrow the question.
- **Where it connects.** The only network connection is to Pulpo's MCP server at `eu1.getpulpo.com`, operated by Pulpo.

## Support and legal

- Support: <https://www.getpulpo.com/contacto>
- Privacy policy: <https://www.getpulpo.com/politicas-de-cookies-y-privacidad>
- Terms: <https://www.getpulpo.com/terminos-y-condiciones>

## Source

Maintained by Pulpo. The tools themselves are served by Pulpo's MCP server, so they update without a new plugin release; this repository holds only the connection and the skills. Licensed under MIT, see `LICENSE`.
