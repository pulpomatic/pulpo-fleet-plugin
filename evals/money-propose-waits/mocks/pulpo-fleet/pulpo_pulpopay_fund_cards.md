Nothing has changed yet: this needs the user's approval.
Load money onto cards
Moves real money: it reaches the card provider.
Cards: 1 · Total: 500.00 MXN
PulpoPay account «Transportes Norte»: 12,000.00 MXN → 11,500.00 MXN
1. Juan Pérez ···· 4821: 500.00 MXN · 150.00 MXN → 650.00 MXN
Can be undone for 90 days: the same money is moved back, as long as it is still there.
Cannot be undone once spent: money a driver spends cannot be taken back.

Show the user this preview as it is (every row, the count, the total and what undo can do) and ask whether to do exactly this. Only after a plain yes, call pulpo_apply_change once with exactly {"approvalId":"apv_7f3a91","tool":"pulpo_pulpopay_fund_cards","rows":1,"total":500,"currency":"MXN","change":"Load 500.00 MXN onto 1 card"}: their client asks them to allow that call, with those values, and that is their approval. If they say no or change anything, do not apply it. It expires at 2026-11-11T18:10:00.000Z. Calling the write tool again does not apply it: it proposes another approval.
