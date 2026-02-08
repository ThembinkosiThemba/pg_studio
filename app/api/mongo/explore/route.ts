import { getConnectionsCollection } from "@/lib/db";
import { MongoClient, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId, connectionId, type, database, collection, limit = 50, skip = 0 } = await req.json();

        if (!userId || !connectionId || !type) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // 1. Get the connection details from our DB
        const connections = await getConnectionsCollection();
        const savedConnection = await connections.findOne({
            _id: new ObjectId(connectionId),
            userId,
        });

        if (!savedConnection) {
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 },
            );
        }

        // 2. Connect to the target MongoDB
        const client = new MongoClient(savedConnection.connectionString);

        try {
            await client.connect();

            if (type === "databases") {
                const adminDb = client.db().admin();
                const result = await adminDb.listDatabases();
                const databases = result.databases.map((db) => db.name).sort();
                return NextResponse.json({ data: databases });
            }

            if (type === "collections") {
                if (!database) {
                    return NextResponse.json({ error: "Database name required" }, { status: 400 });
                }
                const db = client.db(database);
                const collections = await db.listCollections().toArray();
                const collectionNames = collections.map((c) => c.name).sort();
                return NextResponse.json({ data: collectionNames });
            }

            if (type === "documents") {
                if (!database || !collection) {
                    return NextResponse.json({ error: "Database and collection required" }, { status: 400 });
                }
                const db = client.db(database);
                const coll = db.collection(collection);

                const documents = await coll.find({})
                    .limit(limit)
                    .skip(skip)
                    .toArray();

                // Convert ObjectIds and Dates to strings for JSON serialization
                const serializedDocs = JSON.parse(JSON.stringify(documents));

                return NextResponse.json({ data: serializedDocs });
            }

            return NextResponse.json({ error: "Invalid type" }, { status: 400 });

        } finally {
            await client.close();
        }

    } catch (error: any) {
        console.error("Mongo explore error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to explore MongoDB" },
            { status: 500 },
        );
    }
}
