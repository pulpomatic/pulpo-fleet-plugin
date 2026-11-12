---
expect:
  cards: array
---
Nothing has changed yet: this needs the user's approval.
Withdraw money from cards
Moves real money: it reaches the card provider.
Cards: 1 · Total: 350.00 MXN
PulpoPay account «Transportes Norte»: 12,000.00 MXN → 12,350.00 MXN
1. Juan Pérez ···· 4821: 350.00 MXN · 350.00 MXN → 0.00 MXN
Can be undone for 90 days: the same money is moved back, as long as it is still there.
Only money still on a card can be withdrawn; what was spent stays spent.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_w9001","tool":"pulpo_pulpopay_withdrawal_cards","rows":1,"total":350,"currency":"MXN","change":"Withdraw 350.00 MXN from 1 card"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
