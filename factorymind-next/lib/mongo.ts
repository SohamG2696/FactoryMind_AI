import { MongoClient, Db } from "mongodb";

/**
 * MongoDB connection singleton — safe under Next.js hot reload.
 * The client is cached on globalThis so `next dev` doesn't open a new
 * connection every time a file changes.
 */

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "factorymind";

if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Add it to factorymind-next/.env.local " +
      "and restart `next dev`."
  );
}

const options = {
  // Keep pool small — this is a small demo cluster.
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri, options).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

/** Collection names live here so typos become compile errors elsewhere. */
export const COLLECTIONS = {
  users: "users",
  operators: "operators",
  machineAssignments: "machine_assignments",
  inbox: "inbox_messages",
  agentReports: "agent_reports",
  /* v2.0 additions */
  workers: "workers",
  missions: "missions",
  agentDecisions: "agent_decisions",
  assignmentChanges: "assignment_changes",
} as const;
