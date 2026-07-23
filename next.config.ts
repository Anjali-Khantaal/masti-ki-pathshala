import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGitHubBuild = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrganisationSite = repositoryName.endsWith(".github.io");
const githubBasePath =
  isGitHubBuild && repositoryName && !isUserOrOrganisationSite
    ? `/${repositoryName}`
    : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: githubBasePath,
  assetPrefix: githubBasePath,
};

export default nextConfig;
