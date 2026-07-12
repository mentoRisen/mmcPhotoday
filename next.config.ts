import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["photoday.minimoviecon.sk"],
  devIndicators: false,
};

export default nextConfig;
