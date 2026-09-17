import { MongoClient, type Db } from "mongodb";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";

// Fix Windows SRV DNS resolution for MongoDB Atlas in local dev
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // ignore
}

// Global cache for MongoDB client in serverless/development environments
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function loadEnvFallback() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (key === "MONGODB_URI" || key === "MONGODB_DB_NAME") {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

export function getMongoUri(): string {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("<password>")) {
    loadEnvFallback();
  }
  const rawUri = process.env.MONGODB_URI || "";
  // Auto-remove angle brackets around password if present (e.g., mongodb+srv://user:<pass>@host)
  return rawUri.trim().replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)<([^>]+)>(@)/, "$1$2$3");
}

export function getDbName(): string {
  if (!process.env.MONGODB_DB_NAME) {
    loadEnvFallback();
  }
  return process.env.MONGODB_DB_NAME || "dineos_db";
}

export function isMongoConfigured(): boolean {
  const mUri = getMongoUri();
  return Boolean(
    mUri &&
    !mUri.includes("<password>") &&
    !mUri.includes("YOUR_MONGODB_URI") &&
    !mUri.includes("cluster0.xxxxx")
  );
}

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!isMongoConfigured() || !uri) {
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri);
      clientPromise = client.connect().catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  try {
    const mClient = await getMongoClient();
    if (!mClient) return null;
    return mClient.db(getDbName());
  } catch (err) {
    // Reset cached promises on error so subsequent requests can retry fresh
    global._mongoClientPromise = undefined;
    clientPromise = null;
    throw err;
  }
}
