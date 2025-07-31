import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
