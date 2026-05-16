import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/hom-nay",
          "/todo",
          "/tien-do",
          "/yeu-thich",
          "/tong-ket-thang",
          "/lich-tap",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
