import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

let authDb: any = null;

async function getAuthDb() {
  if (!authDb) {
    const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const client = new MongoClient(mongoUrl);
    await client.connect();
    authDb = client.db("postgres-tool");
  }
  return authDb;
}

export async function createUser(email: string, password: string) {
  try {
    const db = await getAuthDb();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return {
      id: result.insertedId.toString(),
      email,
    };
  } catch (error) {
    throw error;
  }
}

export async function verifyUser(email: string, password: string) {
  try {
    const db = await getAuthDb();
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }

    return {
      id: user._id.toString(),
      email: user.email,
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const db = await getAuthDb();
    const users = db.collection("users");
    const { ObjectId } = require("mongodb");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
    };
  } catch (error) {
    throw error;
  }
}
