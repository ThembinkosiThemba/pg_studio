import { verifyUser } from "@/lib/auth-utils";
import { createSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await verifyUser(email, password);

    await createSession(user.id);

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: error.message || "Sign in failed" },
      { status: 401 },
    );
  }
}
