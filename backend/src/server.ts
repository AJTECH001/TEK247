import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import { startEscrowIndexer } from "./services/escrow.indexer";

async function bootstrap(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀  Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Mirror on-chain escrow events into Postgres for fast UI reads.
  startEscrowIndexer();
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
