---
name: fuel-expenses
description: Fuel loads and fleet expenses in Pulpo. Fuel and expense totals for a period, fuel history per vehicle or per payment method, consumption questions, registering a fuel load or an expense, correcting one, approving or rejecting expenses, tags and custom fields on them. Use for "how much did we spend", "fuel last month", "register this ticket", "approve these expenses".
---

# Pulpo fuel and expenses

## Reading and summing

- **Fuel loads:** `pulpo_list_fuels` (newest first). Filter with `q`, for example by vehicle: `{"AND":[{"parent":"vehicle","vehicle":{"in":[123]}}]}`; `searchText` matches vehicle, supplier, reference. One vehicle's whole history: `pulpo_get_fuels_by_vehicle`. One card or payment method: `pulpo_get_fuels_by_payment_method`. One record with custom fields, tags and segments: `pulpo_get_fuel_details`.
- **Expenses:** `pulpo_list_expenses`. Date range with `q`: `{"AND":[{"parent":"date","date":{"range":["2026-05-01T06:00:00.000Z","2026-05-23T05:59:59.999Z"]}}]}` (use the user's timezone to build the bounds). Also `tags`, `searchText`. One record: `pulpo_get_expense_details`.
- **Expense types, fuel types, tax types, approval statuses:** `pulpo_list_catalog_items` or `pulpo_resolve_catalog_id` with `className` `expenses-types`, `fuel-types`, `tax-types`, `expense-approval-statuses`.
- **People and places:** driver ids from `pulpo_list_drivers`, suppliers from `pulpo_get_suppliers_catalog`, locations from `pulpo_list_supplier_locations`, payment methods from `pulpo_get_payment_methods_catalog`.

Rules for numbers:

- **Totals come from `pulpo_get_spend_summary`**, computed by Pulpo over every expense of the period: by expense type (default; fuel is the type with `fuel: true`), `month`, `vehicle` or `supplier`, optionally for some `vehicleIds`. Pass the account's `timeZone` (IANA, e.g. `America/Mexico_City`, `Europe/Madrid`); if you do not know it, ask once. Report its `total`, `count` and groups as they are, with the period, the zone and its `includes`/`excludes` lines in your own words. Never add up `pulpo_list_expenses` or `pulpo_list_fuels` rows yourself.
- Fuel loads are expenses of type Fuel, so fuel spend is that group, not a second sum on top. Maintenances count only when their status records an expense; for a maintenance's own cost read it with `pulpo_list_maintenances`.
- If it refuses (more than 10,000 expenses, a period over a year, rows that changed while reading), say why and offer a shorter period or to ask again. Do not fall back to summing rows.
- Liters, consumption and per-load questions still come from the fuel rows: list them for the user, labelled with the rows read.
- Volume units follow the account's configuration (liters or gallons); do not convert silently.
- Consumption or cost per km needs odometer readings: use `pulpo_get_odometers_history` for the vehicle and say which two readings the figure uses. Without readings, say you cannot compute it.
- Compare like with like: a per-vehicle ranking in a mixed fleet (motorbikes next to trucks) is misleading. Compare within a vehicle type, or normalize first and say how.
- Outliers are questions, not conclusions: "this load is 3 times the vehicle's usual" is a fact; "this is fraud" is not.

## Before any write

The connector's write rules apply (it sends them with its instructions; summary in `getting-started`). What follows adds only this area's own rules. Undo here: a fuel load or an expense created here is undone with `pulpo_undo_change` (it is deleted again, while nobody changed it). Edits replace the whole record and deletes are final: their preview says they cannot be undone.

## Writing

**Fuel loads**

- `pulpo_create_fuel` requires `date`, `volume`, `pricePerUnit`, `taxType` and `discountType` (`PERCENTAGE` or `CURRENCY`) with `tax` and `discount`, `total`, and `fuelTypeId` (resolve with `className: "fuel-types"`). Vehicle, driver, supplier, location, payment method and odometer are optional, but ask for the vehicle and driver; a load with no vehicle is rarely what the user wants.
- Make `total` consistent with the inputs before sending and show the arithmetic in the confirmation. If the user's total does not match, ask which number is right instead of choosing.
- `omitOdometerIfFails` skips the odometer update when the reading fails validation; `admit_archived` allows an archived vehicle. Use either only if the user asked for it.
- `customFieldsMetadata` keys start with `cf_`; tags are `{"tag": "<name>", "module": "fuels"}`; `segments` is a list of segment ids.
- `pulpo_update_fuel` replaces the record: `pulpo_get_fuel_details` first, merge, send the whole object. `pulpo_delete_fuel` is permanent.

**Expenses**

- `pulpo_create_expense` requires `name` (max 100 characters), `expenseTypeId` (`className: "expenses-types"`), `subtotal`, `taxType`, `tax`, `discountType`, `discount`, `total`, `date`. `total` must equal `subtotal + tax - discount`, with percentages applied when the type is `PERCENTAGE`. Check it before calling and again when updating.
- Optional links: `vehicleId`, `driverId`, `paymentMethodId`, `supplierId`, `locationId`, `odometer`, `documents` (ids of documents already uploaded; you cannot upload files from here), `comments`, tags `{"tag": "...", "module": "expenses"}`, `segments`.
- `pulpo_update_expense` replaces the record: `pulpo_get_expense_details` first, merge, send everything.
- **Approval:** `pulpo_update_expense_approval_status` takes a list of expense ids and `approvalStatusCode`: 0 pending, 1 approved, 2 rejected. List the expenses (name, amount, vehicle, date) in the confirmation and say how many. Approving or rejecting many at once is a bulk action: confirm once per set, not per item, and do not widen the set after the yes.
- **Delete:** `pulpo_delete_expense` / `pulpo_delete_expenses` are permanent. A fine registered as an expense is still an expense; fines checked on government portals are a different thing (`getting-started`, traffic fines).
