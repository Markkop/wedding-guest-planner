import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/data-deletion"],
      disallow: ["/api/", "/dashboard", "/invite/", "/login", "/signup", "/handler/"],
    },
    sitemap: "https://guests.markkop.dev/sitemap.xml",
  };
}
