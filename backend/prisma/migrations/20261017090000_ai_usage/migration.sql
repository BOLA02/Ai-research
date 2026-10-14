CREATE TABLE "AiUsage" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "day" DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiUsage_userId_day_key" ON "AiUsage"("userId", "day");

ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
