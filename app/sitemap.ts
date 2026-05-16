import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/constants";
import { EXERCISES } from "@/server/seed/exercises";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

const MUSCLE_SLUGS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/giao-an`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/bai-tap`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/nhom-co`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/dinh-duong`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const planPages: MetadataRoute.Sitemap = WORKOUT_PLANS.map((p) => ({
    url: `${base}/giao-an/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const exercisePages: MetadataRoute.Sitemap = EXERCISES.map((e) => ({
    url: `${base}/bai-tap/${e.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const musclePages: MetadataRoute.Sitemap = MUSCLE_SLUGS.map((m) => ({
    url: `${base}/nhom-co/${m}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...planPages, ...exercisePages, ...musclePages];
}
