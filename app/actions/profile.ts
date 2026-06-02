"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { connectMongoDB } from "@/lib/mongodb";
import {
  normalizeSlug,
  SLUG_MAX_LEN,
  SLUG_MIN_LEN,
} from "@/lib/profile";
import { UserModel } from "@/models/User";

export type ProfileSettingsInput = {
  profileSlug?: string | null;
  profileVisibility?: "public" | "private";
  profileBio?: string | null;
  displayName?: string | null;
};

export type ProfileSettings = {
  profileSlug: string | null;
  profileVisibility: "public" | "private";
  profileBio: string | null;
  displayName: string | null;
};

export type UpdateProfileResult =
  | { ok: true; profile: ProfileSettings }
  | { ok: false; error: string };

const BIO_MAX = 280;
const NAME_MAX = 60;

function sanitizeBio(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, BIO_MAX);
}

function sanitizeDisplayName(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, NAME_MAX);
}

/**
 * Update the current user's social profile (slug, visibility, bio,
 * displayName). All fields are optional — only provided keys are written.
 *
 * Setting `profileVisibility = "public"` requires a non-empty `profileSlug`
 * (either set previously or in the same call). We enforce that here so
 * `/u/<slug>` always exists for a public profile.
 */
export async function updateProfileSettings(
  input: ProfileSettingsInput,
): Promise<UpdateProfileResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };

  await connectMongoDB();
  const me = await UserModel.findOne({ clerkId: userId });
  if (!me) return { ok: false, error: "Không tìm thấy người dùng." };

  const update: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(input, "profileSlug")) {
    if (input.profileSlug === null || input.profileSlug === "") {
      update.profileSlug = null;
    } else {
      const slug = normalizeSlug(input.profileSlug ?? "");
      if (!slug) {
        return {
          ok: false,
          error: `Slug không hợp lệ — chỉ chữ thường, số và dấu gạch nối, ${SLUG_MIN_LEN}-${SLUG_MAX_LEN} ký tự.`,
        };
      }
      // Uniqueness check (the partial unique index also enforces this at the
      // DB level, but pre-checking gives a friendlier error).
      const taken = await UserModel.findOne({
        profileSlug: slug,
        clerkId: { $ne: userId },
      })
        .select({ _id: 1 })
        .lean();
      if (taken) {
        return {
          ok: false,
          error: `Slug "${slug}" đã được người khác sử dụng.`,
        };
      }
      update.profileSlug = slug;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "profileBio")) {
    update.profileBio = sanitizeBio(input.profileBio);
  }

  if (Object.prototype.hasOwnProperty.call(input, "displayName")) {
    update.displayName = sanitizeDisplayName(input.displayName);
  }

  if (input.profileVisibility) {
    if (
      input.profileVisibility !== "public" &&
      input.profileVisibility !== "private"
    ) {
      return { ok: false, error: "Visibility không hợp lệ." };
    }
    update.profileVisibility = input.profileVisibility;
  }

  // Going public without a slug → reject so `/u/<slug>` always resolves.
  const nextSlug =
    Object.prototype.hasOwnProperty.call(update, "profileSlug")
      ? (update.profileSlug as string | null)
      : me.profileSlug ?? null;
  const nextVisibility =
    (update.profileVisibility as "public" | "private" | undefined) ??
    (me.profileVisibility === "public" ? "public" : "private");
  if (nextVisibility === "public" && !nextSlug) {
    return {
      ok: false,
      error: "Cần chọn slug trước khi bật profile công khai.",
    };
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Không có thay đổi nào." };
  }

  try {
    const doc = await UserModel.findOneAndUpdate(
      { clerkId: userId },
      { $set: update },
      { new: true },
    );
    if (!doc) return { ok: false, error: "Không tìm thấy người dùng." };

    revalidatePath("/cai-dat");
    revalidatePath("/bang-xep-hang");
    if (doc.profileSlug) revalidatePath(`/u/${doc.profileSlug}`);

    return {
      ok: true,
      profile: {
        profileSlug:
          typeof doc.profileSlug === "string" ? doc.profileSlug : null,
        profileVisibility:
          doc.profileVisibility === "public" ? "public" : "private",
        profileBio:
          typeof doc.profileBio === "string" ? doc.profileBio : null,
        displayName:
          typeof doc.displayName === "string" ? doc.displayName : null,
      },
    };
  } catch (err) {
    // Race against the partial unique index — surfaces as MongoServerError
    // E11000. Convert to a friendly form rather than 500.
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    if (message.includes("E11000")) {
      return {
        ok: false,
        error: "Slug đã được người khác chọn — thử slug khác.",
      };
    }
    return { ok: false, error: message };
  }
}
