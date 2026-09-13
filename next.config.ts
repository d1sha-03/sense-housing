import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// No nonce here: nonce-based CSP requires every page to opt into dynamic
// rendering, which this app doesn't otherwise need. Without a nonce,
// 'unsafe-inline' on script-src is required too — Next.js injects inline
// bootstrap scripts on every page to pass RSC payload data to the client
// (self.__next_f/__next_r); blocking them breaks hydration entirely. This
// matches Next's own documented "Without Nonces" CSP pattern. 'unsafe-inline'
// on style-src is required by Leaflet, which sets marker/tile styles via
// inline `style=""` attributes (see PropertyMap's divIcon markup).
// upgrade-insecure-requests is skipped in dev: it rewrites every http://
// subresource request to https://, and the dev server only serves plain
// HTTP on localhost, so every JS/CSS chunk request would fail TLS.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.tile.openstreetmap.org;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDev ? "" : "upgrade-insecure-requests;"}
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
