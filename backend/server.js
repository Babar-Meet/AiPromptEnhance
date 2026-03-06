import dotenv from "dotenv";
import { createServer } from "http";
import { app } from "./src/app.js";
import { connectDb } from "./src/services/db.js";
import { seedDefaults } from "./src/services/seed.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDb();
  await seedDefaults();

  const server = createServer(app);
  server.listen(port, () => {
    console.log(`Dr. Ai Prompt Enhance backend listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
