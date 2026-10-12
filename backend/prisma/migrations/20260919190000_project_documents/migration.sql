CREATE TYPE "ProjectDocumentType" AS ENUM ('COVER_PAGE', 'TITLE_PAGE', 'CERTIFICATION', 'DECLARATION', 'DEDICATION', 'ACKNOWLEDGEMENT', 'ABSTRACT', 'TABLE_OF_CONTENTS', 'LIST_OF_FIGURES', 'LIST_OF_TABLES', 'APPENDIX', 'CUSTOM');

CREATE TABLE "ProjectDocument" (
  "id" UUID NOT NULL, "projectId" UUID NOT NULL,
  "type" "ProjectDocumentType" NOT NULL, "title" VARCHAR(500) NOT NULL,
  "content" TEXT NOT NULL DEFAULT '', "position" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Chapter" (
  "id" UUID NOT NULL, "projectId" UUID NOT NULL, "number" INTEGER NOT NULL,
  "title" VARCHAR(500) NOT NULL, "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Section" (
  "id" UUID NOT NULL, "chapterId" UUID NOT NULL, "parentSectionId" UUID,
  "title" VARCHAR(500) NOT NULL, "content" TEXT NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectDocument_projectId_position_idx" ON "ProjectDocument"("projectId", "position");
CREATE UNIQUE INDEX "Chapter_projectId_number_key" ON "Chapter"("projectId", "number");
CREATE INDEX "Chapter_projectId_position_idx" ON "Chapter"("projectId", "position");
CREATE INDEX "Section_chapterId_position_idx" ON "Section"("chapterId", "position");
CREATE INDEX "Section_parentSectionId_idx" ON "Section"("parentSectionId");
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill projects created before this milestone with the same usable structure.
INSERT INTO "ProjectDocument" ("id","projectId","type","title","position","updatedAt")
SELECT gen_random_uuid(), p."id", d.type::"ProjectDocumentType", d.title, d.position, CURRENT_TIMESTAMP
FROM "Project" p CROSS JOIN (VALUES
  ('COVER_PAGE','Cover Page',0),('TITLE_PAGE','Title Page',1),('CERTIFICATION','Certification',2),
  ('DECLARATION','Declaration',3),('DEDICATION','Dedication',4),('ACKNOWLEDGEMENT','Acknowledgement',5),
  ('ABSTRACT','Abstract',6),('TABLE_OF_CONTENTS','Table of Contents',7),
  ('LIST_OF_FIGURES','List of Figures',8),('LIST_OF_TABLES','List of Tables',9)
) AS d(type,title,position);
INSERT INTO "Chapter" ("id","projectId","number","title","position","updatedAt")
SELECT gen_random_uuid(), p."id", c.number, c.title, c.position, CURRENT_TIMESTAMP
FROM "Project" p CROSS JOIN (VALUES
  (1,'Introduction',0),(2,'Literature Review',1),(3,'Methodology',2),
  (4,'Results and Discussion',3),(5,'Conclusion and Recommendations',4)
) AS c(number,title,position);
