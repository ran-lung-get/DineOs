import { MongoClient, type Db } from "mongodb";
import dns from "node:dns";

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

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "dineos_db";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function isMongoConfigured(): boolean {
  const mUri = process.env.MONGODB_URI || "";
  return Boolean(mUri && !mUri.includes("<password>") && !mUri.includes("YOUR_MONGODB_URI"));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  const mClient = await getMongoClient();
  if (!mClient) return null;
  return mClient.db(dbName);
}
