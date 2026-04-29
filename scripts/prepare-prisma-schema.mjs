import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const prismaDir = path.join(cwd, "prisma");
const envPath = path.join(cwd, ".env");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const envValues = parseEnvFile(envPath);
  return envValues.DATABASE_URL?.trim() ?? "";
}

function selectSchemaSource(databaseUrl) {
  if (databaseUrl.startsWith("file:")) {
    return path.join(prismaDir, "schema.sqlite.prisma");
  }

  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("prisma+postgres://")
  ) {
    return path.join(prismaDir, "schema.postgresql.prisma");
  }

  return path.join(prismaDir, "schema.sqlite.prisma");
}

const databaseUrl = resolveDatabaseUrl();
const selectedSchemaPath = selectSchemaSource(databaseUrl);
const targetSchemaPath = path.join(prismaDir, "schema.prisma");
const nextSchema = fs.readFileSync(selectedSchemaPath, "utf8");
const currentSchema = fs.existsSync(targetSchemaPath)
  ? fs.readFileSync(targetSchemaPath, "utf8")
  : "";

if (currentSchema !== nextSchema) {
  fs.writeFileSync(targetSchemaPath, nextSchema);
}

const schemaName = path.basename(selectedSchemaPath);
console.info(
  `[prepare-prisma-schema] Using ${schemaName} for DATABASE_URL=${databaseUrl ? "<set>" : "<missing>"}`
);
