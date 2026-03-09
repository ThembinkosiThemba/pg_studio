import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "postgres-tool";

async function initMongo() {
    console.log(`🔌 Connecting to MongoDB at ${MONGODB_URI}...`);
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("✅ Connected successfully");

        const db = client.db(DB_NAME);

        // 1. Users collection
        console.log("\n🛠️  Setting up 'users' collection indexes...");
        const usersCollection = db.collection("users");
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("   ✅ Created unique index on 'email'");

        // 2. Connections collection
        console.log("\n🛠️  Setting up 'connections' collection indexes...");
        const connectionsCollection = db.collection("connections");
        await connectionsCollection.createIndex({ userId: 1 });
        console.log("   ✅ Created index on 'userId'");

        // 3. Action History collection
        console.log("\n🛠️  Setting up 'action_history' collection indexes...");
        const actionHistoryCollection = db.collection("action_history");
        await actionHistoryCollection.createIndex({ userId: 1 });
        console.log("   ✅ Created index on 'userId'");
        await actionHistoryCollection.createIndex({ connectionId: 1 });
        console.log("   ✅ Created index on 'connectionId'");
        await actionHistoryCollection.createIndex({ createdAt: -1 });
        console.log("   ✅ Created descending index on 'createdAt'");

        console.log("\n🎉 All MongoDB indexes initialized successfully!");

    } catch (error) {
        console.error("❌ Error initializing MongoDB:", error);
        process.exit(1);
    } finally {
        await client.close();
        console.log("🔌 Database connection closed.");
    }
}

initMongo();
