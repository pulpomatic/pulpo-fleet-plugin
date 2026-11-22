Nothing has changed yet: this needs the user's approval.
request odometer
Sends a request to the vehicle’s driver in the Pulpo app.
Rows: 1
1. Ask the driver of vehicle 42 for an odometer reading.
Cannot be undone automatically: the notification may already have been delivered.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_request_odometer","tool":"pulpo_request_odometer","rows":1,"change":"Request an odometer reading from the driver of vehicle 42"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
