import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
async function start() {
  await prisma.$connect();
  const server = app.listen(env.PORT, () =>
    console.log(`ProjectForge API listening on port ${env.PORT}`),
  );
  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
start().catch((error) => {
  console.error("API failed to start", error);
  process.exit(1);
});
