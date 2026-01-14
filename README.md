# Telegram Helpdesk Bot

Small Telegram helpdesk bot that routes user DMs into a single support supergroup using one forum topic per user. Support replies inside the topic are sent back to the user anonymously.

## How it works
- User sends a DM to the bot.
- Bot creates a forum topic in the support group for that user (one user, one topic).
- User messages are copied into the topic.
- Support replies in the topic are copied back to the user.

## Requirements
- Node.js 18+ (recommended)
- A Telegram bot token
- A Telegram supergroup with Topics enabled (forum)

## Setup
1) Install dependencies

```bash
npm install
```

2) Create a `.env` file

```bash
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
SUPPORT_GROUP_ID=YOUR_SUPERGROUP_ID
PORT=3000
```

Notes:
- `SUPPORT_GROUP_ID` must be the numeric chat ID of the support supergroup (e.g. `-1001234567890`).
- `PORT` is only for the tiny Express health endpoint.

3) Start the bot

```bash
npm run dev
```

## Project structure
- `src/index.js`: Express app + bootstraps routing.
- `src/bot.js`: Telegram bot instance.
- `src/routing.service.js`: Message routing logic.
- `src/topic.service.js`: Forum topic creation/mapping.
- `src/db.js`: SQLite mapping database.
- `data/helpdesk.db`: Local SQLite file.

## Behavior details
- Only private chats are routed into the support group.
- Only messages in the support group topics are routed back to users.
- Bot ignores command messages (anything starting with `/`) in DMs.

## Troubleshooting
- If replies are not delivered, confirm the bot has permission to read and post in the support group.
- Ensure the support group is a supergroup with Topics enabled.
- Verify `SUPPORT_GROUP_ID` and `BOT_TOKEN` in `.env`.
