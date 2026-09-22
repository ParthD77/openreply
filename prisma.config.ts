import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env["DATABASE_URL"];

const finalDatabaseUrl =
  databaseUrl &&
  !databaseUrl.includes("@localhost") &&
  !databaseUrl.includes("@127.0.0.1")
    ? `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=no-verify`
    : databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: finalDatabaseUrl,
  },
});