import { getActionsCollection } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const connectionId = req.nextUrl.searchParams.get("connectionId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const actionsCollection = await getActionsCollection();

    const filter: any = { userId };
    if (connectionId) {
      filter.connectionId = connectionId;
    }

    const actions = await actionsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching action history:", error);
    return NextResponse.json(
      { error: "Failed to fetch action history" },
      { status: 500 },
    );
  }
}
