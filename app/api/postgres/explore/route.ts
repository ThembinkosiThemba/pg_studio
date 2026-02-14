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
    const { userId, connectionId, type, tableName, database } = await req.json();

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

    let connectionString = connection.connectionString;
    if (database && type !== "databases") {
      try {
        const url = new URL(connectionString);
        url.pathname = `/${database}`;
        connectionString = url.toString();
      } catch (urlError) {
        console.error("Failed to parse connection URL:", urlError);
      }
    }

    const pool = getPool(connectionString);
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
        `
        SELECT 
          c.column_name, 
          c.data_type, 
          c.is_nullable,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = $1 
        AND c.table_schema = 'public' 
        ORDER BY c.ordinal_position;
        `,
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
