import { getConnectionsCollection, getActionsCollection } from "@/lib/db";
import { Pool } from "pg";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

const pools: Map<string, Pool> = new Map();

function getPool(connectionString: string): Pool {
  if (!pools.has(connectionString)) {
    let cleanedConnectionString = connectionString;
    let sslConfig: any = {
      rejectUnauthorized: false,
    };

    try {
      const url = new URL(connectionString);
      const sslParam =
        url.searchParams.get("sslmode") || url.searchParams.get("ssl");

      if (sslParam === "disable" || sslParam === "false") {
        sslConfig = false;
      }

      url.searchParams.delete("sslmode");
      url.searchParams.delete("ssl");
      cleanedConnectionString = url.toString();
    } catch {}

    pools.set(
      connectionString,
      new Pool({
        connectionString: cleanedConnectionString,
        ssl: sslConfig,
      }),
    );
  }
  return pools.get(connectionString)!;
}

export async function POST(req: NextRequest) {
  let client;
  try {
    const { userId, connectionId, query, action } = await req.json();

    if (!userId || !connectionId || !query) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const pool = getPool(connection.connectionString);
    client = await pool.connect();

    const result = await client.query(query);

    const actionsCollection = await getActionsCollection();
    await actionsCollection.insertOne({
      userId,
      connectionId,
      action: action || "QUERY",
      target: query.substring(0, 50),
      details: query,
      status: "success",
      createdAt: new Date(),
    });

    client.release();

    return NextResponse.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map((f: { name: any }) => f.name),
    });
  } catch (error: any) {
    try {
      const { userId, connectionId, query, action } = await req.json();
      const actionsCollection = await getActionsCollection();
      await actionsCollection.insertOne({
        userId,
        connectionId,
        action: action || "QUERY",
        target: query.substring(0, 50),
        details: query,
        status: "error",
        error: error.message,
        createdAt: new Date(),
      });
    } catch {}

    if (client) {
      client.release();
    }

    console.error("Error executing query:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute query" },
      { status: 500 },
    );
  }
}
