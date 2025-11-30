# Telegram Bot Backend (Next.js)
This project provides a minimal Next.js backend that can receive updates from Telegram and send replies back through the Telegram Bot API.

## Prerequisites

- Node.js 18+
- Docker Desktop (for the local PostgreSQL + pgvector instance)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An HTTPS-accessible endpoint (for development you can use a tunneling tool such as ngrok)

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy the environment template and add your secrets:
   ```sh
   cp .env.local.example .env.local
   ```
   - Set `TELEGRAM_BOT_TOKEN` with the token from BotFather.
   - Set `GOOGLE_API_KEY` with an API key from [Google AI Studio](https://aistudio.google.com) that has access to Gemini.
   - Set `DATABASE_URL` to point at your local database. Example: `postgresql://telegram:telegram@localhost:5436/telegram?schema=public`
3. Start the local Postgres + pgvector container (it listens on host port `5436`):
   ```sh
   docker compose up -d db
   ```
4. Run Prisma migrations (SQL-based) and generate the client:
   ```sh
   npx prisma migrate dev
   npx prisma generate
   ```
   These commands create the `users` table and sync Prisma Client with the schema.

## Development

Start the development server:
```sh
npm run dev
```

Expose the server to the internet (example with ngrok):
```sh
ngrok http http://localhost:3000
```

Tell Telegram to send updates to your webhook (replace placeholders):
```sh
curl "https://api.telegram.org/bot/setWebhook?url=<PUBLIC_URL>/api/telegram"
```
curl "https://api.telegram.org/bot8325123384:AAGptwxHdHvLZumrUAu62b_pw8icpAzZA-w/setWebhook?url=https://brainlessly-unledged-camellia.ngrok-free.dev/api/telegram"

When you send a message to your bot, the handler at `app/api/telegram/route.js` will receive the update, forward the text to LangChain + Gemini (`models/gemini-2.5-flash`), and send Gemini’s response back to the user.
During this process the service will also persist the Telegram sender into the `User` table (if the user is new) via Prisma migrations backed by PostgreSQL.

To remove the webhook during development:
```sh
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook"
```


Steps to setup telegram bot
1. Create the telegram bot to get the TELEGRAM_BOT_TOKEN
- i. Create a bot on Telegram using @BotFather (if haven't already)
- ii. update .env.local with the correct token.
2. Connect our local Next.js service with the telegram bot
- i. Install ngrok
```
brew install ngrok
```
- ii. Create a free account at https://ngrok.com, to get YOUR_NGROK_AUTHTOKEN
- iii. Add YOUR_NGROK_AUTHTOKEN to your terminal session
```
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```
- iv. Expose our local server to the internet.
```
ngrok http 3000
```
After running this, we will get a Forwarding URL (e.g.https://lolhaha-matcha-latte.ngrok-free.dev)
- v. Tell Telegram to send updates to your webhook (replace placeholders):
```
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<FORWARDING_URL>/api/telegram"
```
https://api.telegram.org/bot8250423330:AAHCPJ8MkvqGKjNqumRpJwCfQBbyyU0R1G0/setWebhook?url=https://unaxised-scarabaeiform-cammie.ngrok-free.dev/api/telegram

### Database commands

- Apply new migrations after pulling changes:
  ```sh
  npx prisma migrate dev
  ```
- Open a psql shell (optional):
  ```sh
  docker exec -it telegram_bot_db psql -U telegram -d telegram
  ```
- Stop the local database when you’re done:
  ```sh
  docker compose down
  ```

#### Creating a new migration

1. Edit `prisma/schema.prisma` with your schema change.
2. Generate the migration and apply it to your dev DB:
   ```sh
   npx prisma migrate dev --name <descriptive-name>
   ```
   Prisma creates `prisma/migrations/<timestamp>_<descriptive-name>/migration.sql`. Review this SQL before committing.

#### Reverting a migration during development

If a migration is incorrect:
1. Remove the bad migration folder from `prisma/migrations`.
2. Reset the local database so your schema matches the remaining migrations:
   ```sh
   npx prisma migrate reset
   ```
   (This drops the entire database and recreates the database; ONLY USE IN DEV)
3. Update `prisma/schema.prisma` as needed and re-run `npx prisma migrate dev --name <new-name>` to regenerate a corrected migration.

#### Reverting a migration in production
Unfortunately, there are no way to revert a migration in production. If something goes wrong, add a new migration on top to fix the issue. 

Install:
- Node.js
- Docker desktop
- Postico (UI to look at your database), download Postico 1.5 (don't download 2) https://releases.eggerapps.at/postico2/downloads

Things to do:
- Try running up a Postgres server with docker.
   - Steps:
   - 1. Get the docker-compose.yml into your local machine. I have put in here https://cl1p.net/wxwxwx. Just create a new file with the name docker-compose.yml in your Mac, and then paste the same thing.
   - 2. Open terminal, Run `docker compose up -d db` at the same directory as the docker-compose.yml.
   - 3. You will see it run run run, after finished, you can open Docker Desktop and you will see your DB shows running
   - 4. Now, open Postico, and connect to your local DB. You need to key in your host, user, password etc. Refer to your docker-compose.yml for these details

Create
curl -X POST 'http://localhost:3000/api/knowledge-base' \
-H 'Content-Type: application/json' \
-d '{
    "documentType": "faq",
    "records": [
        {
            "question": "Where is your store?",
            "answer": "Tanjong Pagar, "
        }
    ]
}'

READ
curl 'http://localhost:3000/api/knowledge-base'

UPDATE
curl -X PUT 'http://localhost:3000/api/knowledge-base/1' \
-H 'Content-Type: application/json' \
-d '{
    "documentType": "faq",
    "record": {
            "question": "Where is your store?",
            "answer": "Choa Chu Kang"
   }
}'


1. update create API to save full document text
2. update schema to add soft deleted column, run migration to generate SQL and update database
3. add update and delete document API


I need you to help me to create a frontend for managing the knowledge base for this LLM RAG bot. This is to allow user manage the knowledge base documents used by the LLM RAG process.
We will utilize the app/api/document/* APIs to allow user:
- list all documents, and able to filter by document type.
- create/upload new documents. For creating FAQ, i want the specific input box for question and answer.
- update the documents.
- delete the documents.

To make it extensible, i want to add a left side bar. This current page that we create will be called as "Knowledge Base".
Please use the screenshot for the UI design for the main features. Use Tailwind CSS for the styling.