---
name: getting-started
description: Choose an eligible Pulpo account and keep fleet reads scoped to that account.
---

Use `pulpo_list_accounts` to show the signed-in user's eligible accounts and the currently selected account, when set. If a read asks for a selection, show the returned account names and wait for the user to choose. Use `pulpo_select_account` with the account ID from the list only after the user names the intended account. This saves their active account for this OAuth client.

A single eligible account can be used for reads without saving a choice. If Pulpo rejects a selected account, list eligible accounts again and ask the user which to use. Keep the account scope clear in the answer.

Use the fleet or Terminal skill for data reads. For a request to change fleet records, approve a transaction, or move money, explain that this connector can read fleet data.
