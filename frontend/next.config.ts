import type { NextConfig } from "next";

// The browser talks to /api on the same address as the website, and Next forwards
// it to the API. Keeping everything on one address lets the sign-in cookie be a
// first-party cookie, which phones and privacy-focused browsers accept.
const apiOrigin = (process.env.API_ORIGIN || "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: { proxyTimeout: 120_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};
export default nextConfig;
