import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://pdf-rag-app-xorl.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;