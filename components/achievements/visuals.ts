import {
  Award,
  CalendarCheck2,
  Crown,
  Dumbbell,
  Flame,
  Gem,
  Heart,
  Medal,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import type { AchievementTier } from "@/lib/achievements";

/** Map an achievement's `icon` string to a lucide component. */
export const ACHIEVEMENT_ICONS: Record<string, typeof Award> = {
  Flame,
  Crown,
  Star,
  CalendarCheck2,
  Medal,
  Sparkles,
  Dumbbell,
  Gem,
  Heart,
  Users,
  Award,
};

export type TierStyle = {
  /** Card chrome when unlocked. */
  card: string;
  /** Icon tile background + foreground when unlocked. */
  iconWrap: string;
  /** Tier label pill. */
  pill: string;
};

export const TIER_STYLES: Record<AchievementTier, TierStyle> = {
  bronze: {
    card: "border-amber-200 bg-amber-50",
    iconWrap: "bg-amber-100 text-amber-700",
    pill: "bg-amber-100 text-amber-700",
  },
  silver: {
    card: "border-slate-200 bg-slate-50",
    iconWrap: "bg-slate-200 text-slate-600",
    pill: "bg-slate-200 text-slate-600",
  },
  gold: {
    card: "border-yellow-200 bg-yellow-50",
    iconWrap: "bg-yellow-100 text-yellow-700",
    pill: "bg-yellow-100 text-yellow-700",
  },
  platinum: {
    card: "border-cyan-200 bg-cyan-50",
    iconWrap: "bg-cyan-100 text-cyan-700",
    pill: "bg-cyan-100 text-cyan-700",
  },
};
