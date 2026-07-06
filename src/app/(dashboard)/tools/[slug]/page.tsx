import React from "react";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { getCurrentUser } from "@/lib/auth/dal";
import { ToolWorkspace } from "./ToolWorkspace";
import { RelatedTools } from "@/components/tools/RelatedTools";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const { slug } = params;
  const tool = getToolBySlug(slug);
  
  if (!tool) {
    return {
      title: "Tool Not Found - DigiTools AI",
      description: "The requested tool utility does not exist in our system.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    title: `${tool.seoTitle} - DigiTools AI`,
    description: tool.seoDescription,
    alternates: {
      canonical: `${appUrl}/tools/${tool.slug}`,
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: `${appUrl}/tools/${tool.slug}`,
      type: "website",
      siteName: "DigiTools AI",
    },
  };
}

export default async function ToolDetailPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const { slug } = params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const user = await getCurrentUser();
  // Fetch credits from user profile, default to 5000 if user/credits uninitialized
  const userCredits = user && (user as any).credits !== undefined ? (user as any).credits : 5000;

  // Schema.org structured JSON-LD markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": tool.schemaType,
    "name": tool.name,
    "description": tool.description,
    "applicationCategory": tool.category === "pdf" ? "DocumentApplication" : "ImageApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
    },
  };

  return (
    <>
      {/* Inject structured schema markup for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="space-y-12 pb-10">
        <ToolWorkspace tool={tool} userCredits={userCredits} />
        
        <RelatedTools currentSlug={tool.slug} category={tool.category} />
      </div>
    </>
  );
}
