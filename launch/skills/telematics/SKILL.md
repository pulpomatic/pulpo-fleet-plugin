---
name: telematics
description: Read Terminal connection status, reported sync history, and the mapping of a visible Pulpo vehicle.
---

Use `pulpo_list_telematics_connections` to list Terminal connections in the selected account. Set `includeLastSync` when the user asks about sync history. Distinguish a reported sync time from an unknown or unavailable history. Describe the time as the latest report.

Use `pulpo_get_vehicle_telematics_mapping` with the exact Pulpo ID, such as `V-0012`. If the user provides a plate, resolve it using the fleet overview skill first. Report the returned mapping state and the last recorded odometer when present. For a hidden or missing vehicle, say it could not be found among the visible vehicles.
