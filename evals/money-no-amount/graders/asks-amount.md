---
type: llm
weight: 2
---
PASS if the reply asks the user how much to load (and may ask what "poco saldo" means or which cards), possibly listing the cards with their balances, without choosing an amount or a set of cards on its own. Suggesting an example amount ("500 each?") counts as choosing an amount. Pointing out which cards look low and asking whether those are the ones is asking, not choosing. FAIL if it proposes or states amounts it chose itself, or says cards were funded.
