import dotenv from "dotenv";

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: required("JWT_SECRET", process.env.JWT_SECRET),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};
