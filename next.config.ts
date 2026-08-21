import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Emit a self-contained build for a small Docker runtime image */
  output: "standalone",
  /* App is served at /tenderflow/ behind nginx — must match the proxy path */
  basePath: "/tenderflow",
  /* nginx always adds a trailing slash; match that so there's no 308 ↔ 301 loop */
  trailingSlash: true,
  /* A sibling project's lockfile one level up otherwise gets misdetected as the
   * workspace root, which breaks module resolution (e.g. tailwindcss). */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
