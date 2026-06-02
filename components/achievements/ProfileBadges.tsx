import { Trophy } from "lucide-react";
import type { ProfileSnapshot } from "@/lib/profile";
import { TIER_LABELS_VI } from "@/lib/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACHIEVEMENT_ICONS, TIER_STYLES } from "./visuals";

export function ProfileBadges({
  gamification,
}: {
  gamification: ProfileSnapshot["gamification"];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Thành tích</CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Cấp {gamification.level} · {gamification.levelLabel}
          </span>
          <span className="text-xs text-text-muted">
            {gamification.unlockedCount}/{gamification.totalBadges} huy hiệu
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {gamification.badges.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Chưa mở khoá huy hiệu nào.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {gamification.badges.map((b) => {
              const Icon = ACHIEVEMENT_ICONS[b.icon] ?? ACHIEVEMENT_ICONS.Award;
              const style = TIER_STYLES[b.tier];
              return (
                <li
                  key={b.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                    style.card,
                  )}
                  title={`${b.name} · ${TIER_LABELS_VI[b.tier]}`}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      style.iconWrap,
                    )}
                    aria-hidden
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-text-primary">{b.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
