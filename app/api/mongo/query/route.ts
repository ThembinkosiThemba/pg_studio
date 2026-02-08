import { getConnectionsCollection, getActionsCollection } from "@/lib/db";
import { MongoClient, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId, connectionId, action, database, collection, documentId, query } = await req.json();

        if (!userId || !connectionId || !action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // 1. Get the connection
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

        // 2. Connect
        const client = new MongoClient(savedConnection.connectionString);

        try {
            await client.connect();

            // Log action
            const actionHistory = await getActionsCollection();
            await actionHistory.insertOne({
                userId,
                connectionId,
                action,
                target: database || "server",
                details: JSON.stringify({ database, collection, documentId, query }),
                status: "success",
                createdAt: new Date(),
            });

            if (action === "DROP_DATABASE") {
                if (!database) throw new Error("Database name required");
                await client.db(database).dropDatabase();
                return NextResponse.json({ success: true, message: `Dropped database ${database}` });
            }

            if (action === "DROP_COLLECTION") {
                if (!database || !collection) throw new Error("Database and collection required");
                await client.db(database).collection(collection).drop();
                return NextResponse.json({ success: true, message: `Dropped collection ${collection}` });
            }

            if (action === "DELETE_DOCUMENT") {
                if (!database || !collection || !documentId) throw new Error("Database, collection, and documentId required");

                const db = client.db(database);
                const coll = db.collection(collection);

                let filter;
                try {
                    filter = { _id: new ObjectId(documentId) };
                } catch {
                    filter = { _id: documentId };
                }

                const result = await coll.deleteOne(filter);
                return NextResponse.json({ success: true, deletedCount: result.deletedCount });
            }

            if (action === "FIND") {
                if (!database || !collection) throw new Error("Database and collection required");
                const db = client.db(database);
                const coll = db.collection(collection);

                // TODO: Parse query string to object if needed, currently supporting simple find all
                // If query is a stringified JSON, parse it
                // Check if query is valid JSON
                let filter: any = {};
                if (query) {
                    try {
                        filter = JSON.parse(query);
                    } catch (e) {
                        console.warn("Failed to parse query JSON", e);
                    }
                }

                // Check if it's an aggregation pipeline (array) or contains aggregation operators at root
                const isAggregation = Array.isArray(filter) || Object.keys(filter).some(k => k.startsWith('$') && !['$or', '$and', '$nor', '$not', '$in', '$nin', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$exists', '$type', '$mod', '$regex', '$text', '$where', '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$all', '$elemMatch', '$size', '$bitsAllSet', '$bitsAnySet', '$bitsAllClear', '$bitsAnyClear'].includes(k));

                let docs;
                if (isAggregation) {
                    // Use aggregate
                    // If it's an object but treated as aggregation (e.g. { $match: ... }), wrap in array
                    const pipeline = Array.isArray(filter) ? filter : [filter];
                    docs = await coll.aggregate(pipeline).limit(100).toArray();
                } else {
                    // Use find
                    docs = await coll.find(filter).limit(100).toArray();
                }

                // Convert ObjectIds/Dates
                return NextResponse.json({ data: JSON.parse(JSON.stringify(docs)) });
            }

            return NextResponse.json({ error: "Invalid action" }, { status: 400 });

        } catch (error: any) {
            // Log error
            const actionHistory = await getActionsCollection();
            await actionHistory.insertOne({
                userId,
                connectionId,
                action,
                target: database || "server",
                details: JSON.stringify({ database, collection, documentId, query, error: error.message }),
                status: "error",
                error: error.message,
                createdAt: new Date(),
            });

            throw error;
        } finally {
            await client.close();
        }

    } catch (error: any) {
        console.error("Mongo query error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to execute action" },
            { status: 500 },
        );
    }
}
