---
name: fleet-overview
description: Answer "how is my fleet doing?" from Pulpo. Vehicle counts, fleet health score (Salud de flota) and findings, vehicles missing basic data, driver, odometer or insurance, vehicle alerts, and Terminal telematics connection status and last sync. Reads only, except turning finding types on or off for the account. Use for fleet size, fleet health, findings, and "what should I look at today".
---

# Pulpo fleet overview and health

Vehicle results are scoped to the selected account and the segments the user can see. Terminal connections are account-level and subject to the user's permissions. See `getting-started` if an account must be selected.

## Know which number is which

| Question | Tool | Notes |
| --- | --- | --- |
| How many vehicles in the account | `pulpo_get_vehicles_count` | Account-wide, no filters. |
| How many match a condition | `pulpo_list_vehicles` with `filters` and `take: 1` | Read the total from `_metadata._total_rows`. By default it covers the user's segments and excludes archived vehicles. |
| The fleet's health score | `pulpo_get_fleet_score` | Whole number 0 to 100, the average over the vehicles the user can see. `fleetScore: null` means nothing is scored yet; report `vehiclesEvaluated` out of `vehiclesTotal`. |
| One vehicle's score and what it lacks | `pulpo_get_vehicle_score` | Takes a Pulpo ID (`V-0012`) or plate; VIN or economic number also work. |
| What basic data is missing | `pulpo_get_fleet_basic_data_pending` | Counts per missing field (plate, VIN, brand, model, year) and the empty "En Alta" records, with the worst vehicles first. Filter with `only`, page with `skip`/`take`. |
| Findings across visible vehicles | `pulpo_get_fleet_health` | Pages through visible vehicles and returns only rows with findings. Use `nextSkip` as the next `skip` until it is null, even after an empty findings page. |
| Findings on one vehicle | `pulpo_get_vehicle_fleet_health` | Needs the numeric `vehicleId`. Returns `discoveries`, which are findings, not the score. |
| Which findings are switched on | `pulpo_get_fleet_health_enabled_findings` | Call it before interpreting findings. |
| Active alerts on a vehicle | `pulpo_get_vehicle_alerts` | Numeric `vehicleId`. Empty array means none. |

Rules that save you from wrong answers:

- **The score is the score.** Quote `pulpo_get_fleet_score` as the screen shows it. Never compute your own average from findings or from list rows.
- **Never count missing data by paging `pulpo_list_vehicles`.** Its filters do not see empty fields and the numbers will not match the screen. Use `pulpo_get_fleet_basic_data_pending`.
- **Counts that disagree are not an error.** The account count and a filtered list can differ because of segments and archived vehicles. State the scope you used ("vehicles you can see, not archived").
- **A disabled finding is not a clean result.** If a finding type is off in `pulpo_get_fleet_health_enabled_findings`, say it is not being checked.
- Fleet health findings are `VEHICLES_IN_INOPERABLE_STATUSES`, `VEHICLES_WITHOUT_ASSIGNED_DRIVERS`, `VEHICLES_WITHOUT_RECENT_ODOMETER`, `VEHICLES_WITH_NEAR_ASSIGNMENT_EXPIRATION`, `VEHICLES_WITH_NEAR_INSURANCE_EXPIRATION`, `VEHICLES_WITHOUT_INSURANCE`, `VEHICLES_WITH_INSURANCE_EXPIRED`. If the connector lacks the fleet-wide findings tool, use the filters below and confirm individual vehicles with `pulpo_get_vehicle_fleet_health`.

## Terminal connections

Use `pulpo_list_telematics_connections` for provider connection status in the selected account. Set `includeLastSync: true` when asked for the last reported provider sync. Report an unknown or temporarily unavailable timestamp separately from the connection status. Provider sync and delivery of readings to a vehicle are separate. For a vehicle's mapping, use the `vehicles` skill.

## Filters for the common questions

`pulpo_list_vehicles` takes `filters` as serialized JSON: `{"AND":[{"parent":"vehicle","<field>":{"<operator>":<value>}}]}`. Operators: `is`, `in`, `contains`, `range`, `gt`, `gte`, `lt`, `lte`, `empty`, `not`. Useful fields: `status` (status name), `vehicleStatus` (status id), `type`, `vehicleType`, `brand`, `year`, `archived`, `segments`, `assignedDriver`, `hasDriverAssignment`, `insuranceEndDate`, `insuranceSupplier`. Include `{"all": null}` only when the user wants every vehicle regardless of segment; include `{"archived":{"is":true}}` to look at archived ones.

- Vehicles by status: one count per status name the user cares about, or list a page and group it. Operable vs inoperable comes from the status catalog (`pulpo_list_catalog_items` with `className: "vehicles-status"`, the `behavior` field).
- Without a driver: `hasDriverAssignment` false. Insurance ending soon or expired: `insuranceEndDate` with a `range` from today to the horizon, or up to yesterday for expired. If a filter errors or returns something odd, read one vehicle with `pulpo_get_vehicle_details` and adjust to the real field names rather than guessing again.
- Odometer without a recent reading: use `pulpo_get_odometers_latest`, and ask what "recent" means to the user if they did not say.

## A good overview

1. Call `pulpo_get_fleet_score`, `pulpo_get_vehicles_count` and `pulpo_get_fleet_basic_data_pending` (independent, run together). Add the filtered counts the question needs.
2. Lead with the numbers: vehicles, score with how many are evaluated, what is missing.
3. Then at most five attention items, ordered by consequence for the operation: inoperable vehicles, expired insurance or contracts, no driver, no recent odometer, missing basic data. Name vehicles by plate, name or Pulpo ID, and say how many more there are.
4. Say what you did not check (a finding that is off, segments you cannot see, a page cut short).
5. Offer the next step, not a data dump: open one vehicle, check its alerts, list upcoming maintenance (`maintenance-reminders`).

Fixing what the overview finds (filling data, changing status, assigning a driver) is done with the `vehicles` and `drivers-assignments` skills, with their write rules.

## If the user asks you to fix something

This skill reads, with one exception below. When the user says "fix it", switch to the skill that owns the change; the connector's write rules apply as everywhere.

The exception: which finding types count toward the health score is an account setting. `pulpo_update_fleet_health_enabled_findings` changes it for everyone in the account and patches only the types you send; read `pulpo_get_fleet_health_enabled_findings` first.
