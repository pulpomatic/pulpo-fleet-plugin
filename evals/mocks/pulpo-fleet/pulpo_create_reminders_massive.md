Nothing has changed yet: this needs the user's approval.
create reminders massive
Only changes Pulpo records.
Rows: 1
1. The record as given: current → new as sent
Cannot be undone automatically: the previous state cannot be written back with this tool.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_create_reminders_massive","tool":"pulpo_create_reminders_massive","rows":1,"change":"pulpo_create_reminders_massive: 1 record as proposed"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
