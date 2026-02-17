import { getConnectionsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { createClient } from "redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const connectionId = searchParams.get("connectionId");

    if (!userId || !connectionId) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 },
      );
    }

    const connections = await getConnectionsCollection();
    const connection = await connections.findOne({
      _id: new ObjectId(connectionId),
      userId,
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
      );
    }

    const client = createClient({
      url: connection.connectionString,
    });

    await client.connect();

    // Get keyspace info
    const info = await client.info("keyspace");

    // Parse INFO output
    // # Keyspace
    // db0:keys=5,expires=0,avg_ttl=0
    // db1:keys=1,expires=0,avg_ttl=0

    const databases = [];
    const lines = info.split("\n");
    for (const line of lines) {
      if (line.startsWith("db")) {
        const match = line.match(/db(\d+):keys=(\d+)/);
        if (match) {
          databases.push({
            id: match[1],
            keys: parseInt(match[2]),
          });
        }
      }
    }

    // Always ensure db0 is present if list is empty or db0 not found,
    // though usually we want to show what's there.
    // If no keyspace info (empty redis), return empty or db0.
    if (databases.length === 0) {
      databases.push({ id: "0", keys: 0 });
    }

    await client.disconnect();

    return NextResponse.json({ databases });
  } catch (error) {
    console.error("Error fetching Redis databases:", error);
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 },
    );
  }
}
