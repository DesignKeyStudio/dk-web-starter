import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blocks dev-server assets and HMR for origins other than localhost.
  // Browser tools (Chrome DevTools MCP, Playwright) often open the app as 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: "/storybook",
        destination: "/storybook/index.html",
      },
    ];
  },
};

export default nextConfig;
