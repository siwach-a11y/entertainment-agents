/** @type {import('next').NextConfig} */
const isStaticExport = process.env.BUILD_HTML === "1";
// On GitHub Pages a project site is served from /<repo>, so assets need a base path.
const isGithubPages = process.env.GITHUB_PAGES === "1";
const basePath = isGithubPages ? "/entertainment-agents" : "";

const nextConfig = {
  ...(basePath ? { basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
