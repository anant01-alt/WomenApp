import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to this directory so it doesn't walk up the tree looking
  // for a workspace root and find a parent that has no node_modules.
  // `import.meta.dirname` requires Node 20+ in ESM and points at this file.
  turbopack: {
    root: import.meta.dirname,
  },
  // web-push is a CommonJS native package; keep it out of the bundler's graph.
  serverExternalPackages: ["web-push"],
};

export default nextConfig;
