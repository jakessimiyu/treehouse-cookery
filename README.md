# Treehouse: restaurant site + ordering platform (Next.js)

    cp .env.example .env.local
    npm install && npm run dev

- `/` public site + ordering, `/track/1042` order tracking, `/kitchen` live board, `/admin` sold-out toggles + metrics
- Staff key: `STAFF_KEY` in `.env.local` (defaults to `dev`).
- No Daraja credentials: STK push is simulated and auto-confirms after 4s so you can test the full flow.
- Live M-Pesa: fill `MPESA_*`, expose the app over HTTPS (e.g. ngrok) and set `MPESA_CALLBACK_URL`.
- Data is in memory (`lib/store.ts`) and resets on restart. `db/schema.sql` is the PostgreSQL target; swap the store for Prisma/Drizzle next.
- SSE works on a single Node server; use Postgres LISTEN/NOTIFY or Pusher/Ably when scaling out.
