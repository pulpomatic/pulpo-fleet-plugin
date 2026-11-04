---
name: drivers-assignments
description: Drivers and who drives what in Pulpo. Driver lookup and profile, license type and expiration, active, inactive and terminated drivers, drivers without a vehicle, driver documents and file folders, vehicle-driver and vehicle-payment-method assignments (create, extend, end), creating or updating drivers. Use for "who has vehicle X", "licenses expiring", "assign this driver", "add a driver".
---

# Pulpo drivers and assignments

Drivers are users of type Driver. This connector creates, updates and deletes drivers only. It never creates, promotes, changes or deletes administrators or other user types, and it cannot change roles. If asked, say administrators are managed in Pulpo by an administrator.

## Reading

- **List and filter:** `pulpo_list_drivers`. `userStatus`: 60 active, 61 inactive, 62 terminated. `searchText` matches name or email. `filters` (serialized JSON) supports `licenseExpiration`, `licenseType`, `employeeNumber`, `jobPosition`, `segments`, `hasVehicleAssignment`, `hasPaymentMethodAssignment`, `vehicleType`, `tags`, `cf_customFieldsData` and more.
  - Licenses expiring in a window: `{"AND":[{"parent":"user","licenseExpiration":{"range":["2026-06-01","2026-07-01"]}}]}`
  - Active drivers with no vehicle: `{"AND":[{"parent":"accountUser","userStatus":{"is":60}},{"parent":"vehicleAssignment","hasVehicleAssignment":{"empty":null}}]}`
  - `take` defaults to 10; say when you stopped at a page.
- **Profile:** `pulpo_get_driver_details` with the numeric user id from the list (license, assigned vehicle, segments, tags). By email: `pulpo_get_user_by_email`. Lightweight id/name list of active users: `pulpo_get_users_catalog`. Which drivers have which unit: `pulpo_list_user_fleets`.
- **Catalogs:** `pulpo_get_user_statuses` (status ids), `pulpo_get_user_types`. Never hard-code a type or status id; read it.
- **Documents:** two different things. *Compliance documents* (license, permits, certificates): `pulpo_list_documents`, `pulpo_get_document_details` (metadata plus Base64 content; do not print the content). *Files and folders of an entity*: `pulpo_list_document_archives` and the folder tools below.
- **Assignments:** `pulpo_get_vehicle_assignments`, `pulpo_get_vehicle_latest_assignment` (current and past drivers of a vehicle), `pulpo_get_user_assignments` (everything one driver holds), `pulpo_get_payment_method_assignments`, `pulpo_list_assignments` (needs `entityFrom` and `entityTo` from `vehicles`, `users`, `payment-methods`; optional `date` or `month` as `MM-YYYY`), `pulpo_get_assignments_autocomplete`.
- Two readings of "has no driver" can differ: a vehicle with an assignment that ended is unassigned today. Check dates (`endDate` in the past), not only that a record exists.

## Before any write

- **Ask first.** This connector runs a write as soon as you call it; the confirmation is yours (the host may ask too, and it can be set to auto-approve). Show what will change: the record as the user knows it (plate, name or Pulpo ID, never an internal id), and each field as current value to new value. Wait for a plain yes to that exact action. A yes to something else does not count; if the details change, ask again.
- **Never invent IDs or values.** Take ids from tool results in this conversation. Turn names into catalog ids with `pulpo_resolve_catalog_id`. If a name does not match exactly, or several records fit, list the candidates by name and let the user choose; never pick the closest one or a default.
- **Replace vs patch.** A tool that replaces a whole record drops whatever you leave out: read the record first, merge your change into it, send everything. A tool that patches takes only the fields that change.
- **Irreversible means say so.** Deletes, archives, bulk changes and money movements cannot be undone from Pulpo or from here. Say it in the question, ask once per action, and prefer the reversible alternative when one exists (inactive status instead of delete, lock instead of withdraw).
- **After the call**, report what the tool returned. If it failed, say in plain words what failed and do not retry with different values unless the user agrees.
- **Not found is not "does not exist".** What you can see depends on the account selected, the user's role and their segments. An empty result or a 404 means "no match among what you can access in this account".

## Driver writes

- **Create:** `pulpo_create_driver` needs `name`, `email` and `userStatusId`. Before calling, check the email is free with `pulpo_get_user_by_email`. Resolve the status from `pulpo_get_user_statuses`: a name the user gives maps to its id; with nothing given, use the entry named "Activo" (or the active status), and say so in the confirmation. If a name or id matches no entry, list the options instead of continuing.
- **Update:** `pulpo_update_driver` patches by numeric `userId`. Send only the fields the user asked to change. Never resend segments, tags, license or status that were not asked about. `segments`, `tags` and `customFieldsData` replace the stored value when sent: read `pulpo_get_driver_details` and send the full current value plus the change. Send `userStatusId` only when the user asks to change status. `allowAccess: false` blocks the driver's login; say so.
- **Settings:** `pulpo_update_driver_settings` replaces the number format and timezone (`thousandsSeparator`, `decimalsSeparator`, `timezoneId`); always send all of them, and ask for the current values if you do not know them.
- **Delete:** `pulpo_delete_driver` is permanent. If the goal is that the person stops driving, offer setting the status to inactive or terminated instead, which keeps the history. `pulpo_delete_document` is permanent too.
- **Files and folders:** `pulpo_create_document_folder`, `pulpo_rename_document_file`, `pulpo_rename_document_folder`, `pulpo_move_document_objects` are writes; `pulpo_delete_document_archive`, `pulpo_delete_document_folder` (with everything inside) and `pulpo_delete_document_objects` are permanent.

## Assignment writes

1. **Read before you write.** List the current assignments of the vehicle (`pulpo_get_vehicle_assignments`) or the driver (`pulpo_get_user_assignments`) so you do not create a duplicate or an overlap. `pulpo_get_vehicle_user_assignment` checks date overlap for a given vehicle, driver and `startDate`.
2. **Create:** `pulpo_create_assignment` starts from a vehicle and attaches a driver (`userId`) and/or payment methods; `pulpo_create_user_assignment` starts from a driver and attaches a vehicle and/or payment methods; `pulpo_create_payment_method_assignment` for a card. `startDate` and `endDate` are ISO 8601; no `endDate` means indefinite. Ask for the start date and the odometer at handover when the user has them; do not make them up.
3. **Replacing a previous holder:** if the vehicle or driver already holds an overlapping assignment, show it and ask. Close it with `assignmentsToEnd` (id plus end date); `assignmentsToDelete` removes the record entirely, which loses history, so use it only when the user says the old assignment was a mistake.
4. **Change dates:** `pulpo_update_assignment`; `pulpo_extend_vehicle_user_assignment` moves the end date of a driver assignment.
5. **End or delete:** `pulpo_bulk_end_assignments` ends many active assignments at once (list them all, by vehicle and driver, in the confirmation). `pulpo_delete_assignment` removes the record and needs all path parameters (`assignmentId`, `entityFrom`, `entityId`, `entityTo`) from a list result. Ending keeps history; deleting does not: prefer ending.
