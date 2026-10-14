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

Project creation builds the report from a department template (`src/templates/`). The default is the Kaduna Polytechnic EEE HND template, taken from the department's 2023 guidelines and the 2019 institution guidelines. Two variants exist: `eee-hnd-design` (6 chapters) and `eee-hnd-maintenance` (chapters 1 to 3 from the slides; chapters 4 to 6 are student-defined: the student names them and adds their sections through the chapter and section endpoints). Pass `templateId` when creating a project, or the template is picked from `projectType`. A template holds the preliminary pages, chapters and sections (each with guidance text and prompts), compliance requirements, milestones and the formatting rules. `GET /api/templates` and `GET /api/templates/:id` serve them to the frontend. Everything is created in the same transaction. Their content and sections are persisted through the nested `/api/projects/:projectId/documents`, `/chapters`, and `/sections` endpoints.
