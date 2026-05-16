import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import {
  deleteUserFromWebhook,
  upsertUserFromWebhook,
} from "@/lib/users";

type ClerkUserPayload = {
  id: string;
  email_addresses?: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ClerkDeletedPayload = {
  id: string;
};

type ClerkEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: ClerkDeletedPayload }
  | { type: string; data: unknown };

function pickPrimaryEmail(user: ClerkUserPayload): string | null {
  const list = user.email_addresses ?? [];
  if (list.length === 0) return null;
  const primary = list.find((e) => e.id === user.primary_email_address_id);
  return (primary ?? list[0]).email_address;
}

function pickDisplayName(user: ClerkUserPayload): string | null {
  const full = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (full) return full;
  if (user.username) return user.username;
  const email = pickPrimaryEmail(user);
  return email ? email.split("@")[0] : null;
}

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "CLERK_WEBHOOK_SECRET not configured. Add it to your environment from Clerk Dashboard → Configure → Webhooks.",
      },
      { status: 500 },
    );
  }

  const headerStore = await headers();
  const svixId = headerStore.get("svix-id");
  const svixTimestamp = headerStore.get("svix-timestamp");
  const svixSignature = headerStore.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix signature headers" },
      { status: 400 },
    );
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("Clerk webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data as ClerkUserPayload;
      await upsertUserFromWebhook({
        clerkId: data.id,
        email: pickPrimaryEmail(data),
        displayName: pickDisplayName(data),
      });
    } else if (event.type === "user.deleted") {
      const data = event.data as ClerkDeletedPayload;
      await deleteUserFromWebhook(data.id);
    }
  } catch (err) {
    console.error(`Clerk webhook handler for ${event.type} failed`, err);
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
