import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/constants";
import { isMongoConfigured, connectMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    {
      url: `${base}/bang-xep-hang`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
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

  // Public profiles — only when Mongo is configured (build runs without it
  // in CI / fresh local clones). Gracefully degrade to an empty list on DB
  // error so the sitemap stays available.
  let profilePages: MetadataRoute.Sitemap = [];
  if (isMongoConfigured()) {
    try {
      await connectMongoDB();
      const profiles = await UserModel.find({
        profileVisibility: "public",
        profileSlug: { $type: "string" },
      })
        .select({ profileSlug: 1, updatedAt: 1, _id: 0 })
        .lean<Array<{ profileSlug: string; updatedAt?: Date | string }>>();
      profilePages = profiles.map((p) => ({
        url: `${base}/u/${p.profileSlug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.5,
      }));
    } catch {
      profilePages = [];
    }
  }

  return [
    ...staticPages,
    ...planPages,
    ...exercisePages,
    ...musclePages,
    ...profilePages,
  ];
}
