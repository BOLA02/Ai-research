import type { NextConfig } from "next";

// The browser talks to /api on the same address as the website, and Next forwards
// it to the API. Keeping everything on one address lets the sign-in cookie be a
// first-party cookie, which phones and privacy-focused browsers accept.
const apiOrigin = (process.env.API_ORIGIN || "http://localhost:4000").replace(/\/$/, "");

// The admin area lives at a private address that only you know: set ADMIN_SLUG to something long and
// hard to guess, for example ADMIN_SLUG=desk-7f3k9q2m, and open /desk-7f3k9q2m. With no ADMIN_SLUG the
// area is at /admin. It is never linked from the site, and signing in as an administrator is still required.
const adminSlug = (process.env.ADMIN_SLUG || "").trim().replace(/^\/+|\/+$/g, "");
if (adminSlug && !/^[A-Za-z0-9_-]{8,60}$/.test(adminSlug)) throw new Error("ADMIN_SLUG must be 8 to 60 letters, numbers, dashes or underscores");

const nextConfig: NextConfig = {
  experimental: { proxyTimeout: 120_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }, ...(adminSlug ? [{ source: `/${adminSlug}`, destination: "/admin" }] : [])];
  },
};
export default nextConfig;
