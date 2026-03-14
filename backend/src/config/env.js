import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  hyperApiBaseUrl: requireEnv("HYPER_API_BASE_URL"),
  hyperApiKey: requireEnv("HYPER_API_KEY"),
  hyperApiAuditEndpoint: process.env.HYPER_API_AUDIT_ENDPOINT ?? "/audit/run",
  hyperApiTimeoutMs: Number.parseInt(process.env.HYPER_API_TIMEOUT_MS ?? "15000", 10),
};
