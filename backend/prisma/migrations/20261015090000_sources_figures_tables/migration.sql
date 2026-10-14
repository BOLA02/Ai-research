CREATE TYPE "SourceType" AS ENUM ('BOOK', 'BOOK_CHAPTER', 'JOURNAL', 'CONFERENCE', 'WEBSITE', 'THESIS', 'REPORT', 'STANDARD', 'PATENT', 'OTHER');

CREATE TABLE "Source" (
  "id" UUID NOT NULL, "projectId" UUID NOT NULL, "citeKey" VARCHAR(60) NOT NULL,
  "type" "SourceType" NOT NULL,
  "authors" JSONB NOT NULL DEFAULT '[]', "editors" JSONB NOT NULL DEFAULT '[]',
  "title" VARCHAR(1000) NOT NULL, "containerTitle" VARCHAR(500),
  "year" INTEGER, "month" INTEGER, "day" INTEGER,
  "volume" VARCHAR(30), "issue" VARCHAR(30), "pages" VARCHAR(40), "edition" VARCHAR(30),
  "publisher" VARCHAR(300), "place" VARCHAR(200), "institution" VARCHAR(300),
  "degree" VARCHAR(100), "number" VARCHAR(100), "url" VARCHAR(2000), "doi" VARCHAR(200),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Figure" (
  "id" UUID NOT NULL, "projectId" UUID NOT NULL, "sectionId" UUID,
  "label" VARCHAR(60) NOT NULL, "caption" VARCHAR(1000) NOT NULL, "sourceNote" VARCHAR(1000),
  "isOriginal" BOOLEAN NOT NULL DEFAULT true, "altText" VARCHAR(500),
  "imageData" BYTEA, "mimeType" VARCHAR(60), "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Figure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportTable" (
  "id" UUID NOT NULL, "projectId" UUID NOT NULL, "sectionId" UUID,
  "label" VARCHAR(60) NOT NULL, "caption" VARCHAR(1000) NOT NULL, "sourceNote" VARCHAR(1000),
  "columns" JSONB NOT NULL DEFAULT '[]', "rows" JSONB NOT NULL DEFAULT '[]',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "ReportTable_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Source_projectId_citeKey_key" ON "Source"("projectId", "citeKey");
CREATE INDEX "Source_projectId_idx" ON "Source"("projectId");
CREATE UNIQUE INDEX "Figure_projectId_label_key" ON "Figure"("projectId", "label");
CREATE INDEX "Figure_projectId_idx" ON "Figure"("projectId");
CREATE INDEX "Figure_sectionId_idx" ON "Figure"("sectionId");
CREATE UNIQUE INDEX "ReportTable_projectId_label_key" ON "ReportTable"("projectId", "label");
CREATE INDEX "ReportTable_projectId_idx" ON "ReportTable"("projectId");
CREATE INDEX "ReportTable_sectionId_idx" ON "ReportTable"("sectionId");

ALTER TABLE "Source" ADD CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Figure" ADD CONSTRAINT "Figure_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Figure" ADD CONSTRAINT "Figure_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReportTable" ADD CONSTRAINT "ReportTable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportTable" ADD CONSTRAINT "ReportTable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
