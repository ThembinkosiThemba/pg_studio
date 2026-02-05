import { getConnectionsCollection } from "@/lib/db";
import { Pool } from "pg";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const pools: Map<string, Pool> = new Map();

function getPool(connectionString: string): Pool {
  if (!pools.has(connectionString)) {
    let cleanedConnectionString = connectionString;
    let sslConfig: any = {
      rejectUnauthorized: false,
    };

    try {
      // Parse and remove sslmode from connection string to avoid conflicts
      const url = new URL(connectionString);
      const sslParam =
        url.searchParams.get("sslmode") || url.searchParams.get("ssl");

      if (sslParam === "disable" || sslParam === "false") {
        sslConfig = false;
      }

      // Remove ssl params from URL - we'll handle them via Pool config
      url.searchParams.delete("sslmode");
      url.searchParams.delete("ssl");
      cleanedConnectionString = url.toString();
    } catch {
      // If URL parsing fails, continue with original string
    }

    pools.set(
      connectionString, // Use original as cache key
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
    const { userId, connectionId, type, tableName } = await req.json();

    if (!userId || !connectionId) {
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

    let result;

    if (type === "databases") {
      const queryResult = await client.query(
        `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;`,
      );
      result = queryResult.rows.map((row) => row.datname);
    } else if (type === "tables") {
      const queryResult = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
      );
      result = queryResult.rows.map((row) => row.table_name);
    } else if (type === "columns") {
      if (!tableName) {
        client.release();
        return NextResponse.json(
          { error: "Missing tableName" },
          { status: 400 },
        );
      }
      const queryResult = await client.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position;`,
        [tableName],
      );
      result = queryResult.rows;
    }

    client.release();

    return NextResponse.json({
      success: true,
      data: result,
      type,
    });
  } catch (error: any) {
    if (client) {
      client.release();
    }

    console.error("Error exploring database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to explore database" },
      { status: 500 },
    );
  }
}
