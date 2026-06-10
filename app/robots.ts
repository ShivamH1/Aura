import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/", // Secure API routes from web crawlers
    },
    sitemap: "https://aura-weather.vercel.app/sitemap.xml",
  };
}
