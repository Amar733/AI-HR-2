/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    NEXT_PUBLIC_APP_NAME: "AI Interview",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_VIDEO_URL: "http://localhost:5000/",
  },

  output: "export",

  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || !apiUrl.startsWith("http")) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined correctly");
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
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
