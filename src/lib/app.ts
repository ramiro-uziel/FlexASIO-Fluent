// src/lib/versionChecker.ts

import { writable } from "svelte/store";
import { getVersion } from "@tauri-apps/api/app";

// Create stores for update status and latest version
export const updateAvailable = writable(false);
export const latestVersion = writable<string | null>(null);

// Version checking configuration
const GITHUB_OWNER = "ramiro-uziel";
const GITHUB_REPO = "FlexASIO-Fluent";

function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split(".").map(Number);
  const v2Parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

export async function checkVersion() {
  try {
    const currentVersion = await getVersion();

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const latestRelease = await response.json();
    const githubVersion = latestRelease.tag_name.replace("v", "");

    // Update the latest version store
    latestVersion.set(githubVersion);

    // Only set updateAvailable to true if current version is lower than latest
    const comparison = compareVersions(currentVersion, githubVersion);
    updateAvailable.set(comparison > 0);
  } catch (error) {
    console.error("Error checking version:", error);
    latestVersion.set(null);
  }
}
