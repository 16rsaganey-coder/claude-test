# Weekly Top 3 — Automation Prototypes

Replaces the shared Word doc with two automation options for collecting each
team member's "Top 3 for the week" and rolling it into a single digest for
the CIO. Both target Microsoft 365.

## Option 1 — Power Automate (no-code)

`power-automate/README.md` — a click-through guide for building this with
Microsoft Forms + Power Automate. No hosting, no app registration, IT can
maintain it from the Power Automate portal. Best if you want something
running by Monday.

## Option 2 — Teams bot (code)

`teams-bot/` — a bot that proactively messages each team member every Monday
with an Adaptive Card to fill in their Top 3, then compiles everyone's
answers into a digest emailed to the CIO every Friday. Nicer UX (fill it in
without leaving Teams), but needs an Azure Bot registration and somewhere to
host it.

## Recommendation

Stand up the Power Automate flow first — it's live in under an hour and
solves the actual problem (no more Word doc). Treat the Teams bot as a
follow-on upgrade once you know the format/questions aren't going to change,
since it's more to maintain.
