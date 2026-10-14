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

## Writing coach

The coach reviews a section (or the abstract) and gives feedback: what works, what is missing, what examiners will look for, and questions to answer. It never writes the section for the student.

- **Switched on by `ANTHROPIC_API_KEY`.** With no key, `GET /api/ai/status` reports `enabled: false` and the interface hides the coach. The key stays on the server.
- `POST /api/projects/:projectId/ai/review` with `{ kind: "section" | "document", id }`. Only chapter sections and the abstract can be reviewed. The text is read from the database, so unsaved edits are not sent.
- **What the model sees:** the department template's guidance for that part, the examiner questions and report criteria from the guidelines (`src/templates/examiner.ts`), writing advice from the guidelines' content summary, the project's Chapter 1 objectives for discussion and conclusion sections, and the student's text with citation markers already resolved. Student text is placed inside `<student_text>` and the system prompt tells the model to treat it as data.
- **Guardrails:** at least 30 and at most 8000 words; a daily allowance per student (`AI_DAILY_LIMIT`, default 20, counted in UTC) and a per-minute limit (`AI_BURST_PER_MINUTE`, default 6); a failed or declined review gives its allowance back; quotes the model attributes to the student are checked against the text and dropped if they are not there.
- **Model:** `AI_MODEL`, default `claude-sonnet-5-5`, with `effort: "medium"`, structured JSON output, and `fallbacks: "default"` so a request declined by a safety classifier is retried on the model Anthropic recommends.
- **Privacy:** the student's text is sent to Anthropic to generate the feedback and is not stored by ProjectForge. The interface says so.

## Calculations

A calculation is a set of known values and a list of steps. The server does the arithmetic, so a wrong answer can't be typed in, and writes each step the way a report shows it: the formula, then the numbers, then the answer with its unit, for example `R_B = (V_in − V_BE) / I_B = (12 − 0.7) / 0.003 = 3.767 kΩ`.

- `calculations` (CRUD) and `calculations/preview` (POST `{variables, steps, note}`) under `/api/projects/:projectId`. Preview works a draft out without saving it, for live results while a student types.
- Values are written like `12`, `4.7k`, `100m` or `1u`. Results get an engineering prefix and four significant figures, or a fixed number of decimals if the step asks for it.
- Formulas support `+ − × ÷ ^`, brackets and `sqrt`, `parallel`, `e12` and `e24` (nearest standard resistor value), `sin`, `cos`, `tan`, `ln`, `log10`, `exp`, `abs`, `min`, `max`, `pow`, `round`, `ceil`, `floor`. A step can use the results of earlier steps. The formula is read into a tree and evaluated. It is never run as code (`src/calc/`).
- In text, `[calc:label]` on a line of its own puts the working there. A calculation not mentioned in the text is written at the end of its section. In the Word export the lines are indented, kept together on the page, and variable subscripts such as `V_pk` are lowered.
- The checks report calculations that have mistakes (an error) or sit in no section (a warning).
