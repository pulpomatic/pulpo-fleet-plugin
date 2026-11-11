Nothing has changed yet: this needs the user's approval.
Lock or unlock a card
Changes the card at the card provider.
Juan Pérez ···· 4821 · Locked: no → yes
Can be undone for 90 days: the previous values are written back, as long as nobody changed them since.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_l9001","tool":"pulpo_pulpopay_lock_unlock_card","rows":1,"change":"Juan Pérez ···· 4821: Locked no → yes"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
