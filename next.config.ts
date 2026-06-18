import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Emit a self-contained build for a small Docker runtime image */
  output: "standalone",
  /* App is served at /tenderflow/ behind nginx — must match the proxy path */
  basePath: "/tenderflow",
  /* nginx always adds a trailing slash; match that so there's no 308 ↔ 301 loop */
  trailingSlash: true,
};

export default nextConfig;
