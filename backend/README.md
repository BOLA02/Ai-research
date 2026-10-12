# ProjectForge API

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `SEED_USER_PASSWORD`.
2. Create the PostgreSQL database named in `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run prisma:generate` and `npm run prisma:deploy` to apply the committed migration.
5. Run `npm run seed` to create or reset the development student account.
6. Run `npm run dev` (or `npm run build && npm start`).

The browser session uses an opaque token stored in an HttpOnly `pf_session` cookie. Never expose the database URL or seed password to the frontend.

For future schema changes, update `prisma/schema.prisma` and run `npm run prisma:migrate -- --name describe_the_change` in development. Production deployments should use `npm run prisma:deploy`.

Project creation initializes ten standard preliminary documents and five editable chapters in the same transaction. Their content and sections are persisted through the nested `/api/projects/:projectId/documents`, `/chapters`, and `/sections` endpoints.
