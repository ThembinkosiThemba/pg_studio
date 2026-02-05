import { createUser } from "@/lib/auth-utils";
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const user = await createUser(email, password);

    await createSession(user.id);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: error.message || "Sign up failed" },
      { status: 400 },
    );
  }
}
