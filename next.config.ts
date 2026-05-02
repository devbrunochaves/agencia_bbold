import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/servicos", destination: "/servicos/index.html" },
      { source: "/conteudos", destination: "/conteudos/index.html" },
    ];
  },
};

export default nextConfig;
