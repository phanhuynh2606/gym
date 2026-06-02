import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  type LifetimeStats,
  metricValue,
  summarizeAchievements,
} from "@/lib/achievements";

const ZERO: LifetimeStats = {
  longestStreak: 0,
  currentStreak: 0,
  trainingDaysCompleted: 0,
  perfectDays: 0,
  totalVolume: 0,
  favoritesCount: 0,
  profilePublic: false,
};

function statusFor(stats: LifetimeStats, id: string) {
  const s = evaluateAchievements(stats).find((x) => x.id === id);
  if (!s) throw new Error(`unknown achievement ${id}`);
  return s;
}

describe("metricValue", () => {
  it("maps each metric to its stat field", () => {
    const stats: LifetimeStats = {
      ...ZERO,
      longestStreak: 7,
      trainingDaysCompleted: 12,
      perfectDays: 3,
      totalVolume: 42_000,
      favoritesCount: 5,
      profilePublic: true,
    };
    expect(metricValue(stats, "longestStreak")).toBe(7);
    expect(metricValue(stats, "trainingDaysCompleted")).toBe(12);
    expect(metricValue(stats, "perfectDays")).toBe(3);
    expect(metricValue(stats, "totalVolume")).toBe(42_000);
    expect(metricValue(stats, "favoritesCount")).toBe(5);
    expect(metricValue(stats, "profilePublic")).toBe(1);
    expect(metricValue({ ...stats, profilePublic: false }, "profilePublic")).toBe(0);
  });
});

describe("evaluateAchievements", () => {
  it("returns one status per badge, in catalogue order", () => {
    const statuses = evaluateAchievements(ZERO);
    expect(statuses).toHaveLength(ACHIEVEMENTS.length);
    expect(statuses.map((s) => s.id)).toEqual(ACHIEVEMENTS.map((a) => a.id));
  });

  it("unlocks nothing for a brand-new user", () => {
    const statuses = evaluateAchievements(ZERO);
    expect(statuses.every((s) => !s.unlocked)).toBe(true);
    expect(statuses.every((s) => s.progress === 0)).toBe(true);
  });

  it("unlocks at exactly the threshold and clamps progress to 1", () => {
    const s = statusFor({ ...ZERO, longestStreak: 7 }, "streak-7");
    expect(s.unlocked).toBe(true);
    expect(s.value).toBe(7);
    expect(s.progress).toBe(1);
  });

  it("reports fractional progress while locked", () => {
    const s = statusFor({ ...ZERO, longestStreak: 7 }, "streak-14");
    expect(s.unlocked).toBe(false);
    expect(s.progress).toBeCloseTo(7 / 14, 5);
  });

  it("treats the boolean profile metric as a 1-threshold badge", () => {
    expect(statusFor(ZERO, "profile-public").unlocked).toBe(false);
    expect(
      statusFor({ ...ZERO, profilePublic: true }, "profile-public").unlocked,
    ).toBe(true);
  });
});

describe("summarizeAchievements", () => {
  it("starts a new user at level 1 with no points", () => {
    const summary = summarizeAchievements(evaluateAchievements(ZERO));
    expect(summary).toMatchObject({
      unlockedCount: 0,
      total: ACHIEVEMENTS.length,
      points: 0,
      level: 1,
      levelLabel: "Tân binh",
      nextLevelPoints: 50,
      pointsIntoLevel: 0,
      levelProgress: 0,
    });
  });

  it("sums tier points and derives level + progress", () => {
    const stats: LifetimeStats = {
      ...ZERO,
      longestStreak: 14, // streak-3 (10) + streak-7 (25) + streak-14 (50)
      trainingDaysCompleted: 10, // days-1 (10) + days-10 (25)
      perfectDays: 1, // perfect-1 (10)
      totalVolume: 10_000, // volume-10k (10)
      favoritesCount: 5, // favorites-5 (10)
      profilePublic: true, // profile-public (25)
    };
    const summary = summarizeAchievements(evaluateAchievements(stats));
    expect(summary.unlockedCount).toBe(9);
    expect(summary.points).toBe(175);
    expect(summary.level).toBe(3);
    expect(summary.levelLabel).toBe("Kiên định");
    expect(summary.nextLevelPoints).toBe(300);
    expect(summary.pointsIntoLevel).toBe(25);
    expect(summary.levelProgress).toBeCloseTo(25 / 150, 5);
  });

  it("caps progress at the top level", () => {
    const maxed: LifetimeStats = {
      longestStreak: 30,
      currentStreak: 30,
      trainingDaysCompleted: 100,
      perfectDays: 10,
      totalVolume: 500_000,
      favoritesCount: 5,
      profilePublic: true,
    };
    const summary = summarizeAchievements(evaluateAchievements(maxed));
    expect(summary.unlockedCount).toBe(ACHIEVEMENTS.length);
    expect(summary.level).toBe(5);
    expect(summary.levelLabel).toBe("Huyền thoại");
    expect(summary.nextLevelPoints).toBeNull();
    expect(summary.levelProgress).toBe(1);
  });
});
