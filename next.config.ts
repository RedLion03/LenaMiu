import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const supabaseProjectHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
})();

const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const connectSrcExtras = [
  "https://api.cloudinary.com",
  supabaseProjectHost ? `https://${supabaseProjectHost}` : null,
  supabaseProjectHost
    ? `wss://${supabaseProjectHost.replace(".supabase.co", ".supabase.co")}`
    : null,
]
  .filter(Boolean)
  .join(" ");

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc}`,
  `style-src 'self' 'unsafe-inline'`,
  `font-src 'self' data:`,
  `img-src 'self' data: blob: https://res.cloudinary.com https://img.youtube.com https://i.ytimg.com`,
  `media-src 'self' blob: https://res.cloudinary.com`,
  `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com`,
  `connect-src 'self' ${connectSrcExtras}`.trim(),
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudName ? `/${cloudName}/**` : "/**",
      },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
