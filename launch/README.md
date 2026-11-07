# Pulpo Fleet

Read your Pulpo fleet from an AI assistant. Sign in to Pulpo, then ask about visible vehicles, fleet health findings, or Terminal integrations. The connector uses your current Pulpo account and permissions. Vehicle results respect your segment access.

## Connect

This package is for the seven-tool directory release at `https://eu1.getpulpo.com/mcp`. Use it after the matching server rollout. During review, verify that the endpoint advertises the tools listed in `tools.json`. Sign in through Pulpo OAuth when your client prompts.

For Claude, add the HTTPS server as a custom connector when your account and organization allow it. The directory listing is a separate publication step. [Claude connector guidance](https://claude.com/docs/directory/publish)

## What you can do

- List eligible accounts with `pulpo_list_accounts`. If you choose an account, `pulpo_select_account` saves the choice for your OAuth client.
- Find vehicles with `pulpo_list_vehicles`, get the visible fleet count with `pulpo_get_vehicles_count`, and read paginated findings with `pulpo_get_fleet_health`.
- Check your account's Terminal connection status and optional sync history with `pulpo_list_telematics_connections`. Look up a visible vehicle's current mapping and last recorded odometer with `pulpo_get_vehicle_telematics_mapping`.

## Data and privacy

Tool arguments go to Pulpo. Returned names, plates, findings, or integration details can appear in your assistant conversation and are handled under that product's terms. Pulpo records tool names, outcomes, durations, and account and client identifiers for operational analytics. Those events omit tool arguments and returned records. The only tool that saves a choice is account selection. This release reads fleet records and leaves fleet data, driver assignments, expenses, and PulpoPay unchanged.

- [Pulpo support](https://www.getpulpo.com/contacto)
- [Pulpo privacy policy](https://www.getpulpo.com/politicas-de-cookies-y-privacidad)
- [Pulpo terms](https://www.getpulpo.com/terminos-y-condiciones)
