import "server-only";

import { redirect } from "next/navigation";
import { getOrCreateMongoUser, type MongoUser } from "@/lib/users";

/**
 * Loads the current admin user, redirecting otherwise:
 *  - unauthenticated → /sign-in?redirect_url=/admin
 *  - signed in but role !== "admin" → /hom-nay
 *
 * Use at the top of every server component / server action under /admin.
 */
export async function requireAdmin(): Promise<MongoUser> {
  const user = await getOrCreateMongoUser();
  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }
  if (user.role !== "admin") {
    redirect("/hom-nay");
  }
  return user;
}

/**
 * Returns the current admin user or null without redirecting. Useful for
 * conditional rendering (e.g. hiding the admin link in the TopBar).
 */
export async function getAdminUser(): Promise<MongoUser | null> {
  const user = await getOrCreateMongoUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/**
 * Lightweight predicate for API routes — returns the user if admin, otherwise
 * null. Callers should respond with the right HTTP status (401 vs 403).
 */
export async function authorizeAdminApi(): Promise<
  | { status: "ok"; user: MongoUser }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
> {
  const user = await getOrCreateMongoUser();
  if (!user) return { status: "unauthenticated" };
  if (user.role !== "admin") return { status: "forbidden" };
  return { status: "ok", user };
}
