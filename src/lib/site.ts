/**
 * Canonical public origin for SwapSpace.
 * Single source of truth for QR codes, share links, canonical + og tags and the sitemap.
 * Override per-environment with VITE_SITE_URL (no trailing slash).
 */
const configured = import.meta.env['VITE_SITE_URL'] as string | undefined;

export const SITE = (configured?.replace(/\/+$/, "") || "https://swapspace.online");

export const siteUrl = (path = "/") => `${SITE}${path.startsWith("/") ? path : `/${path}`}`;

export const OG_IMAGE = siteUrl("/og-image.jpg");
