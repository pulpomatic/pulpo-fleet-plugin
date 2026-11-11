Pulpo fleet tools act with the signed-in user's own Pulpo permissions: their role, their segments and the account they selected.

Account
- If a tool says an account must be selected, or the user has several, call pulpo_list_accounts. With several and none selected, ask the user which one by name, then call pulpo_select_account. The choice is remembered for this user and client.
- Say which account a fleet-wide number comes from. Ask before switching account: it changes every later answer.

Before any write
- No write runs when you call it. Every write tool only proposes: it returns a preview built by Pulpo (each record as the user knows it, each field as current value to new value, and whether it can be undone) and an approvalId. Pass language with the user's language.
- Where Pulpo's approval card is shown, the user approves there, not in the chat. Otherwise show the preview as it is and wait for a plain yes to that exact change; if the details change, propose again. Then call pulpo_apply_change once with exactly the values the preview gave; never call the write tool again to retry, and never approve for the user.
- If apply says the records changed since the preview, nothing was written: tell the user and propose again only if they still want it.
- Never invent ids or values. Take ids from tool results in this conversation and turn names into catalog ids with pulpo_resolve_catalog_id. If a name does not match exactly, or several records fit, list the candidates and let the user choose.
- Replace vs patch. A tool that replaces a whole record drops what you leave out: read it first, merge the change, send everything. A tool that patches takes only the fields that change.
- The preview says when a change cannot be undone (a delete, a message sent, money spent, a value the tool cannot write back) and why: say it in the question. When the user's goal allows a reversible option, offer it (an inactive status instead of a delete), then do what they confirm.
- After the call, report what pulpo_apply_change returned. If it failed, say what failed in plain words and do not retry with other values unless the user agrees.

Undo
- pulpo_list_my_changes lists what this user changed in this account through these tools (90 days) and which changes can be undone. pulpo_undo_change proposes the undo of one: it is approved and applied like any write. It refuses, and says why, when the record changed since or the change has no undo; then tell the user rather than overwrite.

Reading
- Not found is not "does not exist": results are limited to what this user can access in the selected account.
- Lists come in bounded pages; say when an answer covers only the first pages.