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

- **No aggregate tool exists.** Totals come from the rows you read. Page through the period (`skip`, `take`) until the page comes back short, or state clearly that the figure covers only the rows read. Do not extrapolate. If you could not complete the period, give the partial figure, labelled as partial, and what is missing; do not call it the total.
- Sum `total` (what was paid), not `subtotal`, unless asked. Keep currencies apart. Say the date range and the filters used.
- Volume units follow the account's configuration (liters or gallons); do not convert silently.
- Consumption or cost per km needs odometer readings: use `pulpo_get_odometers_history` for the vehicle and say which two readings the figure uses. Without readings, say you cannot compute it.
- Compare like with like: a per-vehicle ranking in a mixed fleet (motorbikes next to trucks) is misleading. Compare within a vehicle type, or normalize first and say how.
- Outliers are questions, not conclusions: "this load is 3 times the vehicle's usual" is a fact; "this is fraud" is not.

## Before any write

- **Ask first.** This connector runs a write as soon as you call it; the confirmation is yours (the host may ask too, and it can be set to auto-approve). Show what will change: the record as the user knows it (plate, name or Pulpo ID, never an internal id), and each field as current value to new value. Wait for a plain yes to that exact action. A yes to something else does not count; if the details change, ask again.
- **Never invent IDs or values.** Take ids from tool results in this conversation. Turn names into catalog ids with `pulpo_resolve_catalog_id`. If a name does not match exactly, or several records fit, list the candidates by name and let the user choose; never pick the closest one or a default.
- **Replace vs patch.** A tool that replaces a whole record drops whatever you leave out: read the record first, merge your change into it, send everything. A tool that patches takes only the fields that change.
- **Irreversible means say so.** Deletes, archives, bulk changes and money movements cannot be undone from Pulpo or from here. Say it in the question, ask once per action, and prefer the reversible alternative when one exists (inactive status instead of delete, lock instead of withdraw).
- **After the call**, report what the tool returned. If it failed, say in plain words what failed and do not retry with different values unless the user agrees.
- **Not found is not "does not exist".** What you can see depends on the account selected, the user's role and their segments. An empty result or a 404 means "no match among what you can access in this account".

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
