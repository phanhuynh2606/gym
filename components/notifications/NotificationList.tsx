"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useTransition } from "react";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NotificationView } from "@/lib/notifications";
import { NotificationItem } from "./NotificationItem";

type Props = {
  notifications: NotificationView[];
};

export function NotificationList({ notifications }: Props) {
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read);

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-border-subtle text-text-secondary">
            <Bell className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-medium">Chưa có thông báo</p>
            <p className="mt-1 text-sm text-text-secondary">
              Khi đến giờ tập hoặc có gì cần làm hôm nay, chúng tôi sẽ nhắc
              bạn ở đây.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function markAll() {
    if (pending || unread.length === 0) return;
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {unread.length > 0
            ? `${unread.length} thông báo chưa đọc`
            : "Tất cả đã đọc"}
        </p>
        {unread.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={pending}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            {pending ? "Đang lưu..." : "Đọc tất cả"}
          </Button>
        ) : null}
      </div>
      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} />
          </li>
        ))}
      </ul>
    </div>
  );
}
