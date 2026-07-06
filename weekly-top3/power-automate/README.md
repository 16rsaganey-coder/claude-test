# Weekly Top 3 — Power Automate Setup Guide

No-code version. Uses Microsoft Forms to collect answers and two Power
Automate flows to handle the reminder and the digest. Everything below is
built in the browser — nothing to deploy.

Estimated setup time: 30–45 minutes.

## 1. Create the Form

Go to forms.microsoft.com → **New Form** → name it `Weekly Top 3`.

Add these questions:

| # | Question | Type | Required |
|---|----------|------|----------|
| 1 | Name | Choice (pick from a list of team members) or Text | Yes |
| 2 | Top 3 this week | Long answer (ask for 3 numbered lines) | Yes |
| 3 | Anything blocking you? | Long answer | No |

Tip: use a **Choice** question for Name (list your team) instead of free
text — it makes the digest grouping in step 3 reliable, since typed names
will have typos/casing differences.

Under **Settings**, turn on "Record name" if your org allows it (auto-fills
who submitted, as a backup to the Name question) and restrict to people in
your org.

Copy the form link — you'll paste it into Flow 1.

## 2. Flow 1 — Weekly Reminder

Power Automate → **Create** → **Scheduled cloud flow**.

- Name: `Weekly Top 3 – Reminder`
- Repeat every: `1` `Week`
- On these days: `Monday`
- At these hours/minutes: `09:00`

Add action **Send an email (V2)** (or **Post message in a chat or channel**
if you'd rather it land in Teams):

- To: your team distribution list
- Subject: `Weekly Top 3 — due Thursday EOD`
- Body:
  ```
  Hi team,

  Please fill in your Top 3 for the week by Thursday EOD:
  <paste Forms link>

  Thanks!
  ```

Save. This replaces the "remember to open the Word doc" step with the same
nudge you had at your old job.

## 3. Flow 2 — Friday Digest to the CIO

Power Automate → **Create** → **Scheduled cloud flow**.

- Name: `Weekly Top 3 – Digest`
- Repeat every: `1` `Week`
- On these days: `Friday`
- At these hours/minutes: `08:00`

**Step A — Get responses**
Add action **Forms: List responses** → select the `Weekly Top 3` form.
This only returns metadata per response (Response Id, submitter, submit
date) — not the actual answers, so you can't build the digest from this
action alone. Step C pulls the real answers.

**Step B — Filter to this week's responses**
Forms doesn't let you filter server-side, so add a **Filter array**:
- From: `outputs('List_responses')?['body/value']`
- Condition:
  ```
  item()?['submitDate'] is greater than formatDateTime(addDays(utcNow(), -7), 'yyyy-MM-dd')
  ```

**Step C — Get each response's answers**
Add **Apply to each** over the filtered array from Step B. Inside the
loop, add **Forms: Get response details**:
- Form Id: same `Weekly Top 3` form as Step A
- Response Id: click into the field and pick the **Response Id** token
  from the dynamic content list (it comes from the current loop item —
  under the hood this is `item()?['Response Id']`). Don't type this by
  hand; it has to be the token from the loop.

This is a second, separate call per response — `List responses` gives you
the IDs to loop over, `Get response details` gives you the actual question
answers for one response at a time. Once it's added, the dynamic content
picker will offer your real question text ("Name", "Top 3 this week",
"Anything blocking you?") as outputs of this action.

**Step D — Build the digest body**
Still inside the loop, add **Append to string variable** (`Digest`,
initialized above the loop as an empty string), using the dynamic content
from **Get response details** (Step C), not from Step A:
```
<b><name></b><br/>
<Top 3 this week, with line breaks preserved><br/><br/>
```

**Step E — Send the digest**
After the loop, add **Send an email (V2)**:
- To: CIO's email
- Subject: `Weekly Top 3 — Team Digest (@{formatDateTime(utcNow(),'MMM d')})`
- Body: the `Digest` variable, set the body format to HTML

Save and run a manual test (**Run** → **Run flow**) to confirm formatting
before the first real Friday.

## Notes / gotchas

- If someone doesn't respond, they simply won't appear in the digest —
  decide if you want a "missing this week" list; if so, add a **Compose**
  step that diffs the team roster against submitters.
- If you'd rather post the digest into a Teams channel instead of email,
  swap Step D for **Post adaptive card in a chat or channel** — this is
  also how you'd bridge into the Teams bot option later if you want a
  fancier presentation.
- Everything here lives in Power Automate's version history — no more
  "who has the doc open" problem, and the CIO gets it automatically without
  anyone doing manual compilation.
