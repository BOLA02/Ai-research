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

## Sources, figures, tables and checks

Under `/api/projects/:projectId`:

- `sources` (CRUD): books, papers, websites and so on. The same data is formatted in **IEEE** or **APA**, chosen by the project's `referenceStyle`, so switching style reformats everything.
- `figures` (CRUD, plus `PUT/GET/DELETE figures/:id/image`): images are PNG, JPEG or WebP up to 3 MB, checked by their first bytes.
- `tables` (CRUD): a grid of text cells.
- `report/index`: the bibliography in order, and the number of every figure and table. Figures and tables are numbered 1, 2, 3 in the order they appear in the report, so numbers change by themselves when sections move.
- `report/resolve` (POST `{text}`): replaces markers with the formatted citation or number.
- `report/checks`: problems found against the department's rules (for example, fewer than five related works).

Markers in text: `[@key]` or `[@key, p. 33]` or `[@a; @b]` for sources, `[fig:label]` for a figure and `[tab:label]` for a table. Keys and labels cannot be renamed once created, because the text refers to them.

## Project details and Word export

- A project stores the details its cover, declaration and approval pages need: `studentName`, `registrationNumber`, `supervisorNames`, `coordinatorName`, `hodName`, `externalExaminerName`, `school`, `college` and `graduationYear`. A `PATCH` changes only the fields it names.
- `GET /api/projects/:projectId/export/docx` returns the report as a Word document that follows the department template's format rules: A4, Times New Roman 12, 1.5 spacing, left margin 25 mm and others 20 mm, justified text, page numbers top right, roman numerals for the front matter and 1, 2, 3 for the body, and each chapter on a new page. It includes the cover and title pages, the declaration and approval pages filled from the project details, a table of contents and lists of figures and tables built from bookmarks, every chapter with numbered figures and tables, the references in the chosen style and any appendices.
- The table of contents and lists use page-reference fields. The document asks Word to update fields when it opens, which fills in the page numbers.
- Figure images are PNG or JPEG, up to 3 MB.
