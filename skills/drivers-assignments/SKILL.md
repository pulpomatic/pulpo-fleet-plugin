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

The connector's write rules apply (it sends them with its instructions; summary in `getting-started`). What follows adds only this area's own rules. Undo here: a driver's profile fields (name, email, status, phone, license, job, employee number, code) can be undone with `pulpo_undo_change`; a card assignment made with `pulpo_create_payment_method_assignment` is undone by deleting it. Creating a driver sends an invitation and deleting or ending an assignment cannot be undone: the preview says so.

## Driver writes

- **Create:** `pulpo_create_driver` needs `name`, `email` and `userStatusId`. Before calling, check the email is free with `pulpo_get_user_by_email`. Resolve the status from `pulpo_get_user_statuses`: a name the user gives maps to its id; with nothing given, use the entry named "Activo" (or the active status), and say so in the confirmation. If a name or id matches no entry, list the options instead of continuing.
- **Update:** `pulpo_update_driver` patches by numeric `userId`. Send only the fields the user asked to change. Never resend segments, tags, license or status that were not asked about. `segments`, `tags` and `customFieldsData` replace the stored value when sent: read `pulpo_get_driver_details` and send the full current value plus the change. Send `userStatusId` only when the user asks to change status. `allowAccess: false` blocks the driver's login; say so.
- **Settings:** `pulpo_update_driver_settings` replaces the number format and timezone (`thousandsSeparator`, `decimalsSeparator`, `timezoneId`); always send all of them, and ask for the current values if you do not know them.
- **Delete:** `pulpo_delete_driver` is permanent. If the goal is that the person stops driving, offer setting the status to inactive or terminated instead, which keeps the history. `pulpo_delete_document` is permanent too.
- **Files and folders:** `pulpo_create_document_folder`, `pulpo_rename_document_file`, `pulpo_rename_document_folder`, `pulpo_move_document_objects` are writes; `pulpo_delete_document_archive`, `pulpo_delete_document_folder` (with everything inside) and `pulpo_delete_document_objects` are permanent.

## Assignment writes

To see the current assignments of a vehicle or a driver, read `pulpo_get_vehicle_assignments` or `pulpo_get_user_assignments`; `pulpo_get_vehicle_user_assignment` shows the overlaps of a vehicle and a driver from a `startDate`.

1. **Assign, replace or extend a driver:** `pulpo_assign_driver` takes the vehicle as the user names it (Pulpo ID, plate, VIN or economic number) and the driver (a `userId` from a lookup, or the name, email, employee number, license or phone the user gave). It finds both and checks what the assignment changes. Omit `startDate` for today and `endDate` for a permanent assignment; a day the user gave goes as YYYY-MM-DD.
2. **Its questions are the user's:** when the vehicle already has a driver in that period it asks whether to add the new one next to them (`currentDrivers` `ADD`) or replace them (`REPLACE`: their assignments end, scheduled ones are deleted); when the driver has another vehicle, whether they keep it (`driverOtherVehicles` `KEEP`) or that assignment ends (`END`). Put the question to the user and call again with their answer; never choose.
3. **Confirm what it changes:** like every write it is proposed and applied (see `getting-started`). Its preview is Pulpo's own evaluation of the assignment and everything it changes; one yes to it is enough. If it answers with a proposal and an `effectsKey` instead of a preview to approve (an older connector), show that and call again with the key only after the user's yes. What it can change: the assignments that end or are deleted, the segments the account syncs between drivers and vehicles (a vehicle can be left without segments; that is how the account works) and the pending tasks that move to the driver. A current assignment of the same driver is extended, not duplicated; one that already ended is assigned again from today. One that starts later is saved but does not count until then. Only drivers are assigned, never administrators. A driver who is not in Pulpo is created first with `pulpo_create_driver`, with the segments the tool returns (the vehicle's). A payment method is assigned with `pulpo_create_payment_method_assignment`. An odometer reading at handover, when the user gives one, is saved after the assignment with `pulpo_create_odometer`; never make it up.
4. **From a document or a spreadsheet:** the connector has no tool that reads them. Take the vehicle and the driver from what the user shares (a license or ID names the driver; a sheet has one vehicle and its driver per row) and call `pulpo_assign_driver` for each pair, as above. When a name matches several people or none, ask the user which one before going on with that row. For a sheet, list every assignment and what it changes in one confirmation before the first write, then report which rows were saved and which were not.
5. **End or delete:** `pulpo_bulk_end_assignments` ends many active assignments at once, also to end one earlier than planned (list them all, by vehicle and driver, in the confirmation). `pulpo_delete_assignment` removes the record and needs all path parameters (`assignmentId`, `entityFrom`, `entityId`, `entityTo`) from a list result. Ending keeps history; deleting does not: prefer ending.
