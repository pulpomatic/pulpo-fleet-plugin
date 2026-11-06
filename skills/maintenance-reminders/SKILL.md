---
name: maintenance-reminders
description: Maintenance work orders, preventive maintenance plans and reminders in Pulpo. Overdue and upcoming services, a vehicle's service history, creating or updating a maintenance, changing its status, tasks and categories, maintenance plans, and due-date reminders (license, insurance, ITV, contracts) for vehicles, drivers and payment methods. Use for "what is overdue", "schedule a service", "remind me".
---

# Pulpo maintenance and reminders

## Reading

- **What is overdue or coming up:** `pulpo_list_reminders` with `status` (`expired`, `closeToExpire`, `pending`, `completed`); for maintenance `pulpo_list_maintenances` sorted by `scheduledDate` with a `filters` range on `scheduledDate` or `scheduledKm`. Say what "soon" meant (the window you used). Keep overdue, upcoming and done apart, and only where the returned fields support it.
- **One vehicle:** `pulpo_get_vehicle_upcoming_maintenances` (numeric `vehicleId`) for current and upcoming; `pulpo_list_maintenances` filtered by `vehicle` for history; `pulpo_list_reminders_by_entity` for its reminders.
- **One maintenance:** the user usually says an identifier like `MNT-0045`: call `pulpo_list_maintenances` with `searchText` to find it, then `pulpo_get_maintenance_details` with its UUID.
- **By person:** `pulpo_list_reminders_by_user`.
- **Filters** (`filters`, serialized JSON): `{"AND":[{"parent":"m","<field>":{"<operator>":"<value>"}}]}`. Fields: `state` (status name), `type` (preventive or corrective), `vehicle`, `registrationNumber`, `economicNumber`, `responsible`, `supplier`, `startDate`, `endDate`, `scheduledDate`, `scheduledKm`, `total`, `reference`, `identifier`, `brand`, `model`, `createdAt`. Operators: `is`, `in`, `contains`, `range`, `gt`, `gte`, `lt`, `lte`, `empty`, `not`. `isCanvanView: true` groups results by status.
- **Plans:** `pulpo_list_maintenance_plans`, `pulpo_get_maintenance_plan`, and `pulpo_get_plan_latest_update_job` for the progress of the background job after a plan is created or changed.
- **Configuration:** `pulpo_list_maintenance_categories` (with task types), `pulpo_list_all_maintenance_categories` (including hidden), `pulpo_get_category_tasks`, `pulpo_list_maintenance_status_flows`, `pulpo_get_flow_maintenance_statuses`, `pulpo_get_maintenance_status_flow`, `pulpo_list_transitions_from_status`, `pulpo_list_transitions_to_status`, and one status or transition in detail with `pulpo_get_maintenance_status` / `pulpo_get_maintenance_status_transition`; status groups (Open, In progress, Closed) with `pulpo_get_maintenance_status_categories`.
- **Catalogs:** `pulpo_get_priorities` (High, Medium, Low), `pulpo_get_reminder_status` (Pending, Completed, Expired), `pulpo_get_notification_types` (email, push, SMS). `pulpo_export_reminders` returns a file, not data to answer from.

## Two kinds of ids, never mix them

- **UUID strings:** `maintenanceId`, `taskId`, a task's `type`, category and task-type ids, `planId`, reminder ids.
- **Numbers:** `vehicleId`, `stateId` (maintenance status), `responsibleId`, `primarySupplierId`, `taxTypeId`, `supplierId`, user and driver ids, segment ids, `initialStateId`.
- **"Status" means two things.** `pulpo_update_maintenance_status` moves one work order to another business status (order UUID plus numeric `stateId`). `pulpo_create_maintenance_status`, `pulpo_update_maintenance_status_definition` and the flow tools edit the status definitions and flows themselves.
- A status name becomes its numeric id through `pulpo_get_flow_maintenance_statuses`. A task type UUID comes from `pulpo_list_maintenance_categories` or `pulpo_get_category_tasks`.

## Before any write

The connector's write rules apply (it sends them with its instructions; summary in `getting-started`). What follows adds only this area's own rules.

## Maintenance writes

- **Create:** `pulpo_create_maintenance` needs `type` (`PREVENTIVE`, `CORRECTIVE` or `MISCELLANEOUS`), `name`, `vehicleId`, `stateId`, `tax` and `discount` (percentages), `tasks` and `tags` (each may be `[]`). Find the vehicle with the `vehicles` skill first. A task has no name: its text goes in `description`; it needs `products` (may be `[]`) and a `summary` of `workforce` and `total`; each product needs `name`, `quantity`, `unitPrice` and `status` (for example `ACTIVE`). Ask the user for costs; never estimate them.
- **Change status, dates or odometer:** `pulpo_update_maintenance_status`. Prefer it for status transitions.
- **Change anything else:** `pulpo_update_maintenance` replaces the whole order. Read `pulpo_get_maintenance_details`, merge, send every current field with your change. It is classified as destructive for that reason.
- **Tasks:** `pulpo_create_maintenance_task`, `pulpo_update_maintenance_task` (takes the `taskId`), `pulpo_delete_maintenance_task`. Resolve the task `type` UUID first.
- **Delete:** `pulpo_delete_maintenance` is permanent. Offer to cancel by status instead when that is what the user means.
- **Vehicle status side effect:** `pulpo_can_update_vehicle_status` checks whether the vehicle's status can change from a maintenance. Use it before promising that sending a vehicle to the shop updates its status.
- **Plans:** `pulpo_create_maintenance_plan` and `pulpo_update_maintenance_plan` (full replace: read the plan first) start a background job; say it is queued and offer `pulpo_get_plan_latest_update_job`. Plan status is `ACTIVE`, `DRAFT` or `DELETED`; plan type is `fixed` or `interval`. `pulpo_remove_vehicle_from_plan` also cancels that vehicle's future plan maintenances: say so. `pulpo_delete_maintenance_plan` is permanent.
- **Categories, task types, statuses, flows, transitions:** configuration shared by the whole account. Treat any change as account-wide and say so. Create or change them with `pulpo_create_maintenance_status_flow` / `pulpo_update_maintenance_status_flow`, `pulpo_create_maintenance_status_transition` (one-way, source to destination, both in the same flow), `pulpo_create_maintenance_category` / `pulpo_update_maintenance_category`, `pulpo_create_maintenance_task_type` / `pulpo_update_maintenance_task_type` (inside an existing category). Deleting them (`pulpo_delete_maintenance_category`, `pulpo_delete_maintenance_task_type`, `pulpo_delete_maintenance_status`, `pulpo_delete_maintenance_status_flow`, `pulpo_delete_maintenance_status_transition`) is permanent; run `pulpo_can_delete_maintenance_status` before deleting a status.


## Reminders

- `entityType` is case-sensitive: exactly `vehicles`, `drivers` or `paymentMethods`. `entityId` is the number of that vehicle, driver or payment method.
- **Create:** `pulpo_create_reminder` needs `name`, `entityType`, `entityId`, `responsibleId`, `userIds` (users to notify, may be `[]`), plus `limitDate` (ISO 8601), `priorityId` (`low`, `medium` or `high`) and `notifications` (rules of channel `push` or `email`, an amount and a unit before the due date; `[]` for none). Ask who is responsible and who is notified; take user ids from `pulpo_get_users_catalog` or `pulpo_list_drivers`. Never guess a user id.
- **Many at once:** `pulpo_create_reminders_massive` is asynchronous. Tell the user creation is queued, not done.
- **Update:** read `pulpo_get_reminder_details`, merge, send all fields to `pulpo_update_reminder`.
- **Complete:** `pulpo_complete_reminder`. It is a state change the user may want to undo, so still name the reminder in the question.
- **Delete:** `pulpo_delete_reminders` and `pulpo_delete_reminders_by_entity` are permanent; the second removes every reminder of that entity. List what will go before asking.
- Expiry dates that Pulpo already tracks (insurance, ITV, license, contract) show up in `pulpo_get_vehicle_details`, `pulpo_get_vehicle_alerts` and `pulpo_list_drivers`; do not create a reminder that duplicates one unless the user asks.
