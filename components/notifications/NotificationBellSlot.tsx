import { auth } from "@clerk/nextjs/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { countUnread } from "@/lib/notifications";
import { NotificationBell } from "./NotificationBell";

/**
 * Server component wrapper. Renders nothing when the visitor is signed-out
 * or Mongo isn't configured (in which case there are no notifications to
 * count, and we don't want to attempt a DB query).
 */
export async function NotificationBellSlot() {
  if (!isMongoConfigured()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  let unread = 0;
  try {
    unread = await countUnread(userId);
  } catch {
    // Graceful fallback: render the bell with 0 unread on DB error so the
    // user can still navigate to /thong-bao (which has its own error UI).
    unread = 0;
  }

  return <NotificationBell unreadCount={unread} />;
}
