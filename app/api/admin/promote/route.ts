import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectMongoDB, isMongoConfigured } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

/**
 * POST /api/admin/promote
 *
 * One-time bootstrap to grant the first admin role. The currently signed-in
 * user must have a verified email that matches `INITIAL_ADMIN_EMAIL`. After
 * the first promotion this endpoint becomes a no-op idempotent check.
 */
export async function POST() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "mongodb_not_configured" },
      { status: 503 },
    );
  }
  const initialEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (!initialEmail) {
    return NextResponse.json(
      {
        error: "no_initial_admin",
        message: "Set INITIAL_ADMIN_EMAIL in .env.local first.",
      },
      { status: 503 },
    );
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  await connectMongoDB();
  const user = await UserModel.findOne({ clerkId });
  if (!user) {
    return NextResponse.json(
      {
        error: "user_not_synced",
        message:
          "Mongo user record missing — call after the Clerk webhook has synced.",
      },
      { status: 404 },
    );
  }

  if ((user.email ?? "").toLowerCase() !== initialEmail) {
    return NextResponse.json(
      {
        error: "email_mismatch",
        message: "Signed-in email does not match INITIAL_ADMIN_EMAIL.",
      },
      { status: 403 },
    );
  }

  if (user.role === "admin") {
    return NextResponse.json({
      status: "already_admin",
      clerkId,
      email: user.email,
    });
  }

  user.role = "admin";
  await user.save();

  return NextResponse.json({
    status: "promoted",
    clerkId,
    email: user.email,
  });
}
