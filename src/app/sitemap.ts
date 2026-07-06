import { MetadataRoute } from "next";
import { toolsRegistry } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  // 1. Define static routes
  const staticRoutes = ["", "/login", "/register", "/pricing", "/tools"].map((route) => ({
    url: `${appUrl}${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Define category filter pages
  const categoryRoutes = ["pdf-tools", "image-tools"].map((cat) => ({
    url: `${appUrl}/${cat}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 3. Define dynamic tool specific routes from the registry
  const toolRoutes = toolsRegistry.map((tool) => ({
    url: `${appUrl}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
