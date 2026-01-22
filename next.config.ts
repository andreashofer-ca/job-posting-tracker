import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(__filename),
  },
};

export default nextConfig;
