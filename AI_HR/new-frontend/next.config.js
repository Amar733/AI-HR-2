/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.99aihr.com/api",
    NEXT_PUBLIC_APP_NAME: "AI Interview",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_VIDEO_URL: "https://api.99aihr.com/",
  },

  output: "export",

  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  async rewrites() {
    const apiTarget =
      process.env.API_TARGET_URL || "https://api.99aihr.com/api";
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
