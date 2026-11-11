---
name: pulpopay
description: PulpoPay, Pulpo's fuel card and payments product. Account status and balances, cards and their balances and movements, wallet movements, fuel load checks and compliance score, spending controls, funding requests from drivers and approving them, funding or withdrawing cards, locking cards, and the fleet's payment methods in general (any card: create, edit, status, archive). Money is involved: reads are free, every movement of money needs the user's approval in Pulpo's approval card, and every card change explicit confirmation. Use for any PulpoPay or fleet card question.
---

# PulpoPay

PulpoPay issues cards to drivers and moves money between the company account and those cards. Reading is safe. Writing here moves real money or changes card access, and none of it can be undone from this connector.

## Reading

- **Is it on, and where is it:** `pulpo_get_pulpopay_status` (enabled or not), `pulpo_get_pulpopay_account_onboarding`, `pulpo_get_pulpopay_account_settings` (limits, allowed merchants). If PulpoPay is not enabled, say so and stop for PulpoPay balances, cards and money; the fleet's payment methods in general (last section) work without PulpoPay.
- **Money:** `pulpo_get_pulpopay_account_balances` (total, available, used, currency), `pulpo_get_pulpopay_account_statements` (paged), `pulpo_get_pulpopay_card_balance` (by payment method id).
- **Cards:** `pulpo_get_pulpopay_customer_cards` (all cards: UUID card ids and masked numbers), `pulpo_get_pulpopay_driver_cards` (one driver's). Card ids come in two forms: the card UUID, and the numeric payment method id. Tools say which they take; do not swap them.
- **Movements:** `pulpo_list_pulpopay_movements` (filters, search, paging; amount, date, merchant, type, status, card, driver, vehicle), `pulpo_get_pulpopay_card_movements` (card UUID), `pulpo_get_pulpopay_wallet_card_movements`, `pulpo_get_pulpopay_wallet_movements` (validated plus pending). Reference codes: `pulpo_get_pulpopay_movement_types`, `pulpo_get_pulpopay_merchant_categories`, `pulpo_get_pulpopay_fuels_costs`.
- **Fuel load checks:** `pulpo_list_pulpopay_fuel_load_checks`, `pulpo_get_pulpopay_fuel_load_check` (by UUID), `pulpo_get_pulpopay_fuel_loads_score` (0 to 100 compliance score with total, passed and failed).
- **Controls:** `pulpo_get_pulpopay_controls_settings` (spending restrictions and merchant category limits).
- **Funding requests:** `pulpo_get_fund_card_requests_count` (counts by status), `pulpo_list_fund_card_requests`, `pulpo_list_fund_card_request_details`. List oldest pending first when the user wants to work the queue. Status codes are numeric: read the labels from `pulpo_list_catalog_items` with `className: "fund-card-requests-statuses"`; never guess which code means approved.
- **Scheduled funding:** `pulpo_list_scheduled_fund_cards`, `pulpo_get_scheduled_fund_card`; `pulpo_disable_scheduled_fund_card` stops one. Catalogs `scheduled-fund-cards-frequencies`, `-operation-types`, `-statuses` via `pulpo_list_catalog_items`. Creating or validating a scheduled funding needs a file upload, which this connector does not take: send the user to Pulpo for that, and never improvise it with other money tools.
- **Payment methods** (the fleet's cards in general, not only PulpoPay): `pulpo_list_payment_methods`, `pulpo_get_payment_method_details`, `pulpo_get_payment_methods_catalog`. Archived ones are hidden unless `q` has `archived:{is:true}`.
- Documents and invoices: `pulpo_get_pulpopay_document`, `pulpo_get_pulpopay_recovered_invoices`. Do not print Base64 content.

When you summarize money, give currency, the date range, and whether pending movements are included. Never add a balance and a pending amount without saying you did.

## Before any write

The connector's write rules apply (it sends them with its instructions; summary in `getting-started`). What follows adds only this area's own rules.

## Money and card writes: stricter than the general rules

These move money or change card access: `pulpo_pulpopay_fund_account`, `pulpo_pulpopay_transfer_funds`, `pulpo_pulpopay_fund_cards`, `pulpo_pulpopay_withdrawal_cards`, `pulpo_confirm_fund_card_request`, `pulpo_update_fund_card_request`, `pulpo_disable_scheduled_fund_card`, `pulpo_pulpopay_lock_unlock_card`, `pulpo_pulpopay_change_card_nip`, `pulpo_pulpopay_reassign_card`, `pulpo_update_pulpopay_controls_settings`.

**Money needs the user's approval in Pulpo, not in the chat.** The six tools that move money (`pulpo_pulpopay_fund_account`, `pulpo_pulpopay_transfer_funds`, `pulpo_pulpopay_fund_cards`, `pulpo_pulpopay_withdrawal_cards`, `pulpo_confirm_fund_card_request`, `pulpo_update_fund_card_request`) never move money when you call them. The server reads the current balances, builds the preview itself (from where, to where, amounts, balances before and after, row count and total, rows to check) and returns an `approvalId`. The user approves or declines the whole set in Pulpo's approval card, shown with the result in Claude (web and desktop); you cannot approve for them, and a "yes" in the chat does not count. Once they say they approved, call `pulpo_apply_change` once with that `approvalId`: it runs exactly what they approved, refuses if a balance changed since (then propose again with the new values), and reports row by row what moved. It expires in 10 minutes. Never call the money tool again to retry: that only proposes another approval. Where the client cannot show the card, the tool says so: tell the user to do it in Pulpo.

1. **The user states the amount and the cards.** Never choose an amount, a card, or a number of cards on your own, never round, and never fill a gap with a default. Read the amount back exactly, with currency.
2. **Check before you move.** Read `pulpo_get_pulpopay_account_balances` and, for a card, `pulpo_get_pulpopay_card_balance` (payment method id); for a transfer, the origin card's balance too. Check in `pulpo_get_pulpopay_customer_cards` that each target card is active, not locked. If the money is not there or a card cannot receive it, say so and stop.
3. **Propose exactly what the user asked:** one approval per batch, every card and amount as the user gave them (for a spreadsheet, every row, in its order), so the count and total the card shows match theirs. A batch holds at most 200 rows; split bigger ones. If the server refuses to propose (not enough balance, a request already answered), tell the user why and stop. For the card and lock writes below, which need no approval card, confirm in the chat with the whole picture: driver name plus last four digits, never full ids.
4. **Funding requests:** read the request with `pulpo_list_fund_card_request_details` first. Approve or reject a single one with `pulpo_confirm_fund_card_request` (amount, numeric status, optional comment); several with `pulpo_update_fund_card_request`. An approval can fund a card, so confirm the amount. A rejection should carry a reason the driver will see. Do not approve a set bigger than what the user named.
5. **Locking and unlocking:** read the card's current state with `pulpo_get_pulpopay_customer_cards` first; saying "locked" or "unlocked" when it already is would be noise.
6. **Controls:** `pulpo_update_pulpopay_controls_settings` replaces the whole configuration. Read `pulpo_get_pulpopay_controls_settings`, apply the change to that, send everything.
7. **Card issuing and PIN:** `pulpo_pulpopay_create_card`, `pulpo_pulpopay_activate_cards` (by payment method ids) and `pulpo_pulpopay_change_card_nip` change who can spend. Verify the target card and driver first. Never echo a PIN back into the conversation after it is set, and do not store it.
8. **Fuel load check notes:** `pulpo_update_pulpopay_fuel_load_check` updates extra data; read the check first.
9. After any of these, report what the tool returned. `pulpo_apply_change` says row by row what moved and what did not; for a row it could not confirm, read that card's balance before doing anything else. Never move money again to make up for a row that failed without a new approval.

To reconcile card spending with fuel loads, `pulpo_get_fuels_by_payment_method` returns the fuel records paid with a given card (see `fuel-expenses`).

## Payment methods (any card, not only PulpoPay)

- `pulpo_create_payment_method` registers one (name, slug, supplier). `pulpo_update_payment_method` replaces the whole record: read `pulpo_get_payment_method_details`, merge the change, send everything. For a status change only (activate, suspend, block) use `pulpo_update_payment_method_status`.
- `pulpo_archive_payment_methods` hides them from active lists and is reversible (`archive: false`). `pulpo_delete_payment_method` is permanent: offer archiving first.
- `pulpo_export_payment_methods` returns a file, not data to answer from.
- `pulpo_pulpopay_create_pomelo_client` creates the account's client at Pomelo, PulpoPay's card issuer. It is part of PulpoPay onboarding, not a fleet task: call it only when the user explicitly asks for exactly that.
