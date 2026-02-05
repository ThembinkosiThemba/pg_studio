import { MongoClient, Db } from "mongodb";

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB() {
  if (!mongoClient) {
    const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017";
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    db = mongoClient.db("postgres-tool");
  }
  return db!;
}

export async function getConnectionsCollection() {
  const database = await connectToMongoDB();
  return database.collection("connections");
}

export async function getActionsCollection() {
  const database = await connectToMongoDB();
  return database.collection("action_history");
}

export interface PostgresConnection {
  _id?: string;
  userId: string;
  name: string;
  connectionString: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionHistory {
  _id?: string;
  userId: string;
  connectionId: string;
  action:
    | "DELETE_ROWS"
    | "DROP_TABLE"
    | "DROP_DATABASE"
    | "QUERY"
    | "CREATE_TABLE";
  target: string;
  details: string;
  status: "success" | "error";
  error?: string;
  createdAt: Date;
}
