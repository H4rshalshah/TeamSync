import { getEnv } from "../utils/get-env";

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "5000"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  MONGO_URI: getEnv("MONGO_URI", ""),
  LOCAL_DEMO_MODE: getEnv("LOCAL_DEMO_MODE", "false") === "true",

  SESSION_SECRET: getEnv("SESSION_SECRET"),
  SESSION_EXPIRES_IN: getEnv("SESSION_EXPIRES_IN"),

  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: getEnv("GOOGLE_CALLBACK_URL"),
  GITHUB_CLIENT_ID: getEnv("GITHUB_CLIENT_ID", ""),
  GITHUB_CLIENT_SECRET: getEnv("GITHUB_CLIENT_SECRET", ""),
  GITHUB_CALLBACK_URL: getEnv("GITHUB_CALLBACK_URL", ""),

  SMTP_HOST: getEnv("SMTP_HOST", ""),
  SMTP_PORT: getEnv("SMTP_PORT", "587"),
  SMTP_SECURE: getEnv("SMTP_SECURE", "false") === "true",
  SMTP_USER: getEnv("SMTP_USER", ""),
  SMTP_PASS: getEnv("SMTP_PASS", ""),
  SMTP_FROM: getEnv("SMTP_FROM", "Team Sync <no-reply@teamsync.local>"),

  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "localhost"),
  FRONTEND_GOOGLE_CALLBACK_URL: getEnv("FRONTEND_GOOGLE_CALLBACK_URL"),
});

export const config = appConfig();
