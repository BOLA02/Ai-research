CREATE TABLE "Calculation" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "sectionId" UUID,
  "label" VARCHAR(60) NOT NULL,
  "title" VARCHAR(300) NOT NULL,
  "note" VARCHAR(500),
  "variables" JSONB NOT NULL DEFAULT '[]',
  "steps" JSONB NOT NULL DEFAULT '[]',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Calculation_projectId_label_key" ON "Calculation"("projectId", "label");
CREATE INDEX "Calculation_projectId_idx" ON "Calculation"("projectId");
CREATE INDEX "Calculation_sectionId_idx" ON "Calculation"("sectionId");

ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
