import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, getBaseUrl } from "./constants";

type BuildMetadataInput = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const baseUrl = getBaseUrl();
  const url = new URL(input.path, baseUrl).toString();
  const description = input.description ?? SITE_DESCRIPTION;
  const image = input.image
    ? new URL(input.image, baseUrl).toString()
    : `${baseUrl}/opengraph-image`;
  const fullTitle = input.title.includes(SITE_NAME)
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      locale: "vi_VN",
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

type BreadcrumbItem = {
  name: string;
  href: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, baseUrl).toString(),
    })),
  };
}

type HowToInput = {
  name: string;
  description: string;
  steps: string[];
  image?: string;
  tips?: string[];
};

export function buildHowToJsonLd(input: HowToInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    ...(input.image ? { image: input.image } : {}),
    step: input.steps.map((text, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      text,
    })),
    ...(input.tips && input.tips.length > 0
      ? {
          tip: input.tips.map((text) => ({
            "@type": "HowToTip",
            text,
          })),
        }
      : {}),
  };
}

type ArticleInput = {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
};

export function buildArticleJsonLd(input: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: {
      "@type": "Organization",
      name: input.author ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: new URL("/icon.svg", getBaseUrl()).toString(),
      },
    },
  };
}

export function buildWebsiteJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/bai-tap?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: new URL("/icon.svg", baseUrl).toString(),
    description: SITE_DESCRIPTION,
  };
}
