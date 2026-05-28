import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const FOLDER = "gymvn/admin";

/**
 * POST /api/cloudinary/sign
 *
 * Returns short-lived signed parameters that the browser uses to upload
 * directly to Cloudinary. The API secret stays on the server.
 *
 * Returns 503 if Cloudinary env vars are missing — the UI shows a banner
 * instead of crashing.
 */
export async function POST() {
  const auth = await authorizeAdminApi();
  if (auth.status === "unauthenticated") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (auth.status === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error: "cloudinary_not_configured",
        message:
          "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local.",
      },
      { status: 503 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: FOLDER,
  });
}
