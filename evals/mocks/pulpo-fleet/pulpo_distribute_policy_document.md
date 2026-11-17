Nothing has changed yet: this needs the user's approval.
distribute policy document
Sends the approved PDF version to the selected drivers in the Pulpo app.
Rows: 1
1. Driver 9401 receives Safety policy.pdf (SHA-256 6f84c16373f459b75595402cd2ce9d689f07b4fb2ca856827fcc4c773887baae)
Delivery cannot be recalled automatically.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_distribute_policy_document","tool":"pulpo_distribute_policy_document","rows":1,"change":"Distribute Safety policy.pdf · SHA-256 6f84c16373f459b75595402cd2ce9d689f07b4fb2ca856827fcc4c773887baae · Driver 9401"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
