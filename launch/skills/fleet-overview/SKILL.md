---
name: fleet-overview
description: Find visible vehicles, count them, and read fleet health findings in Pulpo.
---

Use `pulpo_list_vehicles` to look up vehicles by plate, name, or economic number with `searchText`. Report only fields in the response. For an exact plate lookup, check the returned plate before describing the vehicle. If `hasMore` is true, narrow the search.

Use `pulpo_get_vehicles_count` for the exact vehicle count in the selected account and visible segments. A list page can be partial.

Use `pulpo_get_fleet_health` for findings. Use `searchText` when the user wants a particular vehicle. Follow `nextSkip` for additional pages, including a page that contains no findings. Report when results cover only part of the matching fleet. Keep the finding list separate from the exact vehicle count.
