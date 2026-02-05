import { getConnectionsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, name, connectionString } = await req.json();

    if (!userId || !name || !connectionString) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const connections = await getConnectionsCollection();
    const result = await connections.insertOne({
      userId,
      name,
      connectionString,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: result.insertedId,
      userId,
      name,
    });
  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const connections = await getConnectionsCollection();
    const userConnections = await connections.find({ userId }).toArray();

    const safeConnections = userConnections.map(
      ({ connectionString, ...rest }) => rest,
    );
    return NextResponse.json(safeConnections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { connectionId } = await req.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: "Missing connectionId" },
        { status: 400 },
      );
    }

    const connections = await getConnectionsCollection();
    await connections.deleteOne({ _id: new ObjectId(connectionId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 },
    );
  }
}
