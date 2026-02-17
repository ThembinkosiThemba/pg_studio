import { getConnectionsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { createClient } from "redis";
import { NextRequest, NextResponse } from "next/server";

async function getRedisClient(
  userId: string,
  connectionId: string,
  database?: string,
) {
  const connections = await getConnectionsCollection();
  const connection = await connections.findOne({
    _id: new ObjectId(connectionId),
    userId,
  });

  if (!connection) {
    throw new Error("Connection not found");
  }

  const client = createClient({
    url: connection.connectionString,
  });

  await client.connect();

  if (database) {
    await client.select(parseInt(database));
  }

  return client;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const connectionId = searchParams.get("connectionId");
    const key = searchParams.get("key");
    const database = searchParams.get("database") || undefined;

    if (!userId || !connectionId || !key) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 },
      );
    }

    const client = await getRedisClient(userId, connectionId, database);

    try {
      const type = await client.type(key);
      const ttl = await client.ttl(key);
      let value: any = null;

      if (type === "string") {
        value = await client.get(key);
      } else if (type === "list") {
        value = await client.lRange(key, 0, -1);
      } else if (type === "set") {
        value = await client.sMembers(key);
      } else if (type === "zset") {
        value = await client.zRange(key, 0, -1);
      } else if (type === "hash") {
        value = await client.hGetAll(key);
      } else if (type === "none") {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
      } else {
        value = `[Unsupported type: ${type}]`;
      }

      return NextResponse.json({
        key,
        type,
        ttl,
        value,
      });
    } finally {
      await client.disconnect();
    }
  } catch (error: any) {
    console.error("Error fetching Redis value:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch value" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, connectionId, key, type, value, database } =
      await req.json();

    if (!userId || !connectionId || !key || !value) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 },
      );
    }

    const client = await getRedisClient(userId, connectionId, database);

    try {
      // For now, simple set for strings. complex logic for others if needed.
      // We currently only support creating/updating strings in UI efficiently.
      if (typeof value === "object") {
        // Try to store as JSON string if it looks like an object/array,
        // OR if the user intends to store a hash?
        // For now, simplify: everything is a string via SET unless logic expands.
        await client.set(key, JSON.stringify(value));
      } else {
        await client.set(key, String(value));
      }

      return NextResponse.json({ success: true });
    } finally {
      await client.disconnect();
    }
  } catch (error: any) {
    console.error("Error setting Redis value:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set value" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req); // Re-use POST logic for updates for now
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const connectionId = searchParams.get("connectionId");
    const key = searchParams.get("key");
    const database = searchParams.get("database") || undefined;

    if (!userId || !connectionId || !key) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 },
      );
    }

    const client = await getRedisClient(userId, connectionId, database);

    try {
      await client.del(key);
      return NextResponse.json({ success: true });
    } finally {
      await client.disconnect();
    }
  } catch (error: any) {
    console.error("Error deleting Redis key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete key" },
      { status: 500 },
    );
  }
}
