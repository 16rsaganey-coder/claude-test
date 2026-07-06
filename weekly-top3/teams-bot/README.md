# Weekly Top 3 — Teams Bot

Prototype bot: proactively asks each team member for their Top 3 every
Monday via an Adaptive Card, stores the answers, and emails a compiled
digest to the CIO every Friday.

This is a working scaffold, not a finished production service — see
**Known limitations** before relying on it.

## How it works

1. Each team member installs the bot (personal scope) and sends it any
   message once, so it learns how to reach them (`bot.js` stores a
   "conversation reference" per user in `data.json`).
2. Monday 9am (cron), the bot proactively sends everyone the `top3Card`
   Adaptive Card (`cards/top3Card.json`).
3. When someone submits the card, `bot.js` stores their answers in
   `data.json`.
4. Friday 8am (cron), `digest.js` pulls the last 7 days of submissions,
   builds an HTML digest, and emails it to the CIO via Microsoft Graph
   (`sendMail`, application permission).

Anyone can also type `top3` to the bot at any time to fill it in early
(useful for testing).

## Setup

### 1. Azure Bot registration

1. Azure Portal → **Create a resource** → **Azure Bot**.
2. Type: **Multi Tenant**. This gives you `BOT_APP_ID` / `BOT_APP_PASSWORD`
   (create a client secret under **Certificates & secrets**).
3. Messaging endpoint: `https://<your-host>/api/messages` (see hosting
   below — for local testing use a tunnel, e.g. `devtunnel` or `ngrok`, and
   point the endpoint at the tunnel URL).
4. Under **Channels**, add the **Microsoft Teams** channel.

### 2. Azure AD app registration for Graph (mail sending)

1. Azure Portal → **App registrations** → **New registration** (can reuse
   the bot's app registration if you prefer one app).
2. **API permissions** → add **Mail.Send** (Application permission, not
   delegated) → **Grant admin consent**.
3. **Certificates & secrets** → create a client secret.
4. You need a mailbox the app is allowed to send as — either a shared
   mailbox (`MAIL_SENDER_UPN`) or restrict via an
   `ApplicationAccessPolicy` in Exchange Online so this app can only send
   as that one mailbox (recommended — don't leave Mail.Send unrestricted
   tenant-wide).

### 3. Configure and run

```
cp .env.example .env   # fill in the values from steps 1-2
npm install
npm start
```

### 4. Package and sideload into Teams

1. Put a 192x192 `color.png` and a 32x32 transparent `outline.png` in
   `manifest/` (Teams requires these; there are none checked in).
2. Replace the two `00000000-...` placeholders in `manifest/manifest.json`
   with your bot's `BOT_APP_ID`.
3. Zip `manifest.json`, `color.png`, `outline.png` together.
4. Teams → **Apps** → **Manage your apps** → **Upload an app** → **Upload
   a custom app** → select the zip. (Org-wide install needs Teams admin
   center approval — talk to whoever manages your tenant's app policies.)

## Known limitations (prototype, not production)

- **Storage**: `storage.js` writes to a local `data.json` file. Fine for a
  demo/single instance; not safe for concurrent writes or multiple hosts.
  Swap for Azure Table Storage or Cosmos DB before real use.
- **Roster**: there's no admin UI to see who has/hasn't installed the bot
  yet — it only knows about users after they've messaged it once.
- **No retry/backoff** on the Graph mail call or proactive sends.
- **Digest format** is a flat HTML list; adjust `buildDigestHtml` in
  `digest.js` to match whatever format the CIO actually wants.
- Needs to be hosted somewhere always-on (Azure App Service, Container
  Apps, etc.) for the cron schedules and the `/api/messages` endpoint to
  work — this won't run on a laptop that sleeps.

If the Power Automate flow (see `../power-automate/README.md`) covers your
needs, it's considerably less to operate than this. Reach for this bot
once the format is stable and you want the nicer in-Teams fill-in
experience.
