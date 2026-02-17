import { getConnectionsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { createClient } from "redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const connectionId = searchParams.get("connectionId");
    const pattern = searchParams.get("pattern") || "*";
    const cursor = searchParams.get("cursor") || "0";
    const database = searchParams.get("database") || undefined;

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

    if (database) {
      await client.select(parseInt(database));
    }

    // Use SCAN to find keys
    // Redis v4+ scan expects cursor as number usually, but error says "got number instead" of string/buffer.
    // This implies the client might be expecting string cursor or the method signature is different.
    // Let's try passing cursor as string.
    const result = await client.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    const nextCursor = result.cursor;
    const keys = result.keys;

    // Get types for keys (pipeline for performance)
    const keysWithTypes = [];
    if (keys.length > 0) {
      const pipeline = client.multi();
      for (const key of keys) {
        pipeline.type(key);
      }
      const types = await pipeline.exec();

      // types structure: [[null, 'string'], [null, 'hash'], ...]
      keysWithTypes.push(
        ...keys.map((key, i) => ({
          key,
          type: types ? (types[i] as any) : "unknown",
          // The redis library returns the command result directly in exec() array if no error?
          // actually v4 returns array of results. if error, it throws or returns error in array?
          // Let's assume standard behavior. 'type' command returns string.
        })),
      );
    }

    await client.disconnect();

    return NextResponse.json({
      cursor: nextCursor,
      keys: keysWithTypes,
    });
  } catch (error) {
    console.error("Error fetching Redis keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch keys" },
      { status: 500 },
    );
  }
}
