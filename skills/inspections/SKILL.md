---
name: inspections
description: Vehicle inspections and checklists in Pulpo. Which checklist forms exist, recorded inspections (answers) by date, vehicle or form, the detail of one inspection, failed or alert answers, verifying an inspection, recording a new inspection, creating or editing checklist templates. Use for "inspections this week", "which vehicles failed the pre-trip check", "record an inspection".
---

# Pulpo inspections and checklists

Two different things with two different UUIDs. Never mix them up.

- A **checklist** (template, form) defines sections and fields: type, options and `alertValues`. Tools: `pulpo_list_checklists`, `pulpo_get_checklist_details`, `pulpo_create_checklist`, `pulpo_update_checklist`, `pulpo_delete_checklist`.
- A **checklist answer** (inspection) is one completed form for one vehicle, with a value per field. Tools: `pulpo_list_checklist_answers`, `pulpo_get_checklist_answer_details`, `pulpo_create_checklist_answer`, `pulpo_update_checklist_answer`, `pulpo_verify_checklist_answer`, `pulpo_delete_checklist_answer`.

All checklist and inspection ids, field ids and tag ids are UUID strings. Only `vehicleId`, segment ids and users mentioned in comments are numbers.

## Reading

1. **Inspections in a period:** `pulpo_list_checklist_answers` with `q` as serialized JSON, for example `{"AND":[{"parent":"date","date":{"range":["2026-01-01T00:00:00.000Z","2026-01-31T23:59:59.999Z"]}}]}`. Use the user's timezone for the bounds. `templateId` restricts to one form; `searchText` and paging (`skip`, `take`, default 20) as usual. Say the range and that a page is a page.
2. **What a form asks:** `pulpo_get_checklist_details` shows sections, fields (types: checkbox, date, document, image, select, currency, number, odometer, radio, signature, text, textarea, time, autocomplete), options and `alertValues`.
3. **What was answered:** `pulpo_get_checklist_answer_details` returns the value per field. Match the field UUIDs to the template to give readable results.
4. **Which answers were flagged:** a value that is in the field's `alertValues` is an alert. Compare answers with the template's `alertValues` instead of judging by the text of the answer. Alerts can create a maintenance automatically when the template has `maintenanceConfig`; check `pulpo_list_maintenances` before telling the user a maintenance was or was not created.
5. **Verification:** an inspection is `VERIFIED` or `NOT_VERIFIED`. Report it as recorded; do not infer it.
6. If the user names a plate or a form by name, resolve the vehicle with `pulpo_list_vehicles` and the form with `pulpo_list_checklists` first. Photos, signatures and documents in answers are references; you cannot view them from here.

## Summaries that help

- Failures and alerts first, grouped by form and by vehicle, with counts and dates; then volume (how many inspections in the range, how many vehicles inspected out of the fleet size from `pulpo_get_vehicles_count`).
- Vehicles with no inspection in the period are a finding only if the user told you what cadence they expect. Ask rather than assume.

## Before any write

- **Ask first.** This connector runs a write as soon as you call it; the confirmation is yours (the host may ask too, and it can be set to auto-approve). Show what will change: the record as the user knows it (plate, name or Pulpo ID, never an internal id), and each field as current value to new value. Wait for a plain yes to that exact action. A yes to something else does not count; if the details change, ask again.
- **Never invent IDs or values.** Take ids from tool results in this conversation. Turn names into catalog ids with `pulpo_resolve_catalog_id`. If a name does not match exactly, or several records fit, list the candidates by name and let the user choose; never pick the closest one or a default.
- **Replace vs patch.** A tool that replaces a whole record drops whatever you leave out: read the record first, merge your change into it, send everything. A tool that patches takes only the fields that change.
- **Irreversible means say so.** Deletes, archives, bulk changes and money movements cannot be undone from Pulpo or from here. Say it in the question, ask once per action, and prefer the reversible alternative when one exists (inactive status instead of delete, lock instead of withdraw).
- **After the call**, report what the tool returned. If it failed, say in plain words what failed and do not retry with different values unless the user agrees.
- **Not found is not "does not exist".** What you can see depends on the account selected, the user's role and their segments. An empty result or a 404 means "no match among what you can access in this account".

## Writes

- **Record an inspection:** `pulpo_create_checklist_answer` needs the TEMPLATE `id`, the numeric `vehicleId`, `fields` (answers keyed by the template's field UUIDs, for example `{"<field uuid>": "Good"}`), and `tags` (`[]` when none; tags look like `{"tag": "...", "module": "checklist-answers"}`). Get the field UUIDs and valid options from `pulpo_get_checklist_details`. Ask the user for every answer; never fill in a field they did not give. If you only have a plate or a form name, resolve them as above; never guess. Show the form, the vehicle and each field with its answer before sending. If the answers hit `alertValues` and the form has `maintenanceConfig`, a maintenance is created automatically: say so in the question. `generateMaintenance` and `generatePDF` are optional; do not set them unless the user asks.
- **Update an inspection or a template:** these replace the record. Read the current one first, merge your change, send all required fields. `alertValues` must be a subset of that field's options; setting them turns on alerts.
- **Verify:** `pulpo_verify_checklist_answer` sets `VERIFIED` or `NOT_VERIFIED`. Name the inspection (form, vehicle, date).
- **Create a template:** `pulpo_create_checklist` with sections and fields, status `ACTIVE` or `DRAFT`. Prefer `DRAFT` until the user has reviewed it.
- **Delete:** `pulpo_delete_checklist` and `pulpo_delete_checklist_answer` are permanent. When the goal is only to stop using a form, offer the reversible option first: an update that sets it to `DRAFT`.
