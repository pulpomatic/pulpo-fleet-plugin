---
name: vehicles
description: Find, inspect and change vehicles in Pulpo. Lookup by plate, name, economic number or Pulpo ID (V-0012), vehicle details, status and status history, insurance policies, renting/leasing/purchase contract data, ITV or technical inspection date, odometer readings, Terminal telematics mapping, change history, creating vehicles, changing status, archiving or deleting. Use for any question about one vehicle or a group of vehicles and for any vehicle edit.
---

# Pulpo vehicles: lookup and changes

## Find the vehicle

1. Use `pulpo_list_vehicles`. By plate, name or economic number: `searchText`. By Pulpo ID (`V-0012`, `v12`, "el V 12"): the `pulpoId` field alone; `searchText` does not match it. The tool normalizes the format.
2. A Pulpo ID is the platform's permanent code (`platformCode`) for a vehicle, unique per account, never reused, and the only handle for a vehicle created with no plate. Never invent one and never send `platformCode` on create or update; it cannot be edited. It can be `null` on very old vehicles: identify those by plate, name or economic number.
3. Check the returned plate or `platformCode` really is what the user asked for. If the list is empty, say you found no vehicle with that plate or Pulpo ID among the vehicles the user can access (it may not exist or sit in a segment outside their access). Never fall back to a similar vehicle.
4. Archived vehicles are left out of lists unless you pass `{"archived":{"is":true}}` in `filters` (a `pulpoId` lookup includes them). By default only the user's segments are listed; `{"all": null}` in `filters` widens the search.
5. For the whole record use `pulpo_get_vehicle_details` with the numeric `vehicleId` from the list. Plate lists alone: `pulpo_get_vehicles_registration_numbers`.

## What details tell you

`pulpo_get_vehicle_details` returns technical data, the assigned driver, status, insurance, segments, tags, custom fields, and:

- `vehicleProperties` (contract data): `status` is `active`, `expiring`, `expired` or `missing`; `daysUntilExpiration` is negative when already expired; `completeness.missingFields` says exactly what is not filled in. Types: purchase, leasing, renting, rental.
- `compliance.itv`: `status` and `daysUntilExpiration` for the inspection (ITV, verificacion vehicular, revision tecnica, controle technique). Report in plain words: overdue by N days, due in N days, no date registered.
- An empty value (`null`, `""`, or `"-"` for year) means not filled in, not that Pulpo does not track it.

More reads: `pulpo_get_vehicle_status_history`, `pulpo_get_vehicle_change_history` (who changed what), `pulpo_list_vehicle_insurance` and `pulpo_get_vehicle_insurance_detail`, `pulpo_get_vehicle_assignments` and `pulpo_get_vehicle_latest_assignment` (driver history, see `drivers-assignments`), `pulpo_get_odometers_latest`, `pulpo_get_odometers_history` and `pulpo_list_odometers`, `pulpo_get_vehicle_upcoming_maintenances`, `pulpo_get_vehicle_alerts`, `pulpo_get_vehicle_score`. One reading: `pulpo_get_odometer` (read it before `pulpo_update_odometer`) and `pulpo_get_odometer_transaction` (the reading tied to a fuel load). Pickers and catalogs: `pulpo_get_vehicles_catalog` (id, name and plate only), `pulpo_get_vehicles_types`, `pulpo_get_vehicles_brands`, `pulpo_get_vehicle_statuses_catalog`, `pulpo_get_vehicle_properties_catalog`. `pulpo_export_vehicle_change_history` returns a file, not data to answer from.

When the connector lists `pulpo_get_vehicle_telematics_mapping`, call it with the visible vehicle's Pulpo ID. If the tool is absent, say the current connector cannot retrieve the mapping. A complete result with no mappings means no current mapping was found. Partial and unavailable results are inconclusive. Report mapping and ingestion eligibility separately from the latest vehicle odometer, which can come from another source.

## Before any write

The connector's write rules apply (it sends them with its instructions; summary in `getting-started`). What follows adds only this area's own rules.

## Changing a vehicle

- **`pulpo_update_vehicle` patches.** Send only what changes. `segments`, `tags` and `customFieldsData` replace the stored value when sent: call `pulpo_get_vehicle_details` first and send the full current value plus your change. Tags go by name and module (`{"tag": "...", "module": "vehicles"}`), not by id.
- **Plate, VIN, brand, model and year of an existing vehicle** go only through `pulpo_update_vehicle_basic_data`; `pulpo_update_vehicle` does not take them. It works in two calls. Call it first without `confirmed`: it writes nothing and returns the current and new value per field with a status. Show the user that table; `CONFLICT` and `INVALID` fields are never written, and `BRAND_APPROXIMATE` needs the user to pick one of the listed brands. After a plain yes, call it again with the same arguments and `confirmed: true`, then report the per-field result.
- **Catalog values** (status, type, ownership type, fuel type, brand): resolve each with `pulpo_resolve_catalog_id` using `className` `vehicles-status`, `vehicles-types`, `properties-types`, `fuel-types`, `vehicles-brands`. Exact match only. When it returns suggestions instead, write nothing: show the candidates by name and let the user choose, even when there is only one. For a brand with no match, retry with a shorter fragment ("Nis"), then look in `pulpo_get_vehicle_catalog_items` (`vehicles-brands`); if it is truly absent say you did not find it in the catalog (not that it does not exist) and ask whether to create it with `pulpo_create_catalog_item`.
- **Status:** `pulpo_update_vehicle_status` for one vehicle, with a reason when the user gives one (`statusChangeReason`); `pulpo_bulk_update_vehicle_status` for many (list the vehicles by plate in the confirmation).
- **Contract data** (renting, leasing, purchase): send `propertyTypeId` and `vehicleProperties` together, and always resend every current contract value plus the change (the backend replaces the record). Read `pulpo_get_vehicle_details` first. If a value needs to come from the original contract, ask the user to check the document in Pulpo. Required: purchase needs `purchaseDate`; leasing and renting need `supplierId`, `referenceCode`, `endDate`, `odometerContracted`; rental needs `supplierId`, `referenceCode`, `endDate`. Carry over what the vehicle already has, ask only for what `completeness.missingFields` still lacks, and summarize before sending. Suppliers: `pulpo_get_suppliers_catalog`.
- **ITV:** `verificationDate` is the NEXT due date, not when the last inspection happened. If the user says it was done today, ask for the next due date before writing.
- **Creating:** `pulpo_create_vehicle` has no mandatory field. Ask what the user wants to fill in, create with what they give, resolve catalog values as above, and the plate must be unique (check `pulpo_list_vehicles` first). Report the new vehicle's Pulpo ID from the response.
- **Odometer:** `pulpo_validate_odometer` before `pulpo_create_odometer` when the reading might conflict with earlier ones; exactly one unit (`km`, `mi` or `hrs`). `pulpo_update_odometer` replaces the reading: read it first.
- **Insurance:** `pulpo_create_vehicle_insurance`, `pulpo_update_vehicle_insurance`; `pulpo_delete_vehicle_insurance` is irreversible.
- **Assignments** belong to `drivers-assignments`.

## Deleting and archiving

- `pulpo_archive_vehicles` hides vehicles from operational lists, they can no longer be edited, and they cannot be unarchived from Pulpo or from here. Only Pulpo Support can unarchive on request. Say exactly that in the question. Never offer an unarchive; if asked, refuse and send the user to Pulpo Support.
- `pulpo_delete_vehicle` and `pulpo_delete_vehicles_multiple` are permanent and can fail with a conflict while the vehicle has active maintenance, expenses or assignments. Offer archiving or inactive status first when the user's goal is only to stop using a vehicle.
- Confirm with plates or Pulpo IDs, never ids, and one action per yes.
