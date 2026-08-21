/**
 * Pure mapping of npm registry responses onto git tags (no I/O — the fetches
 * live in syncGitHistory.ts). A git tag `vX.Y.Z` corresponds to the npm
 * version `X.Y.Z` of the `sanity` package; npm adds what git can't know:
 * when the version actually shipped to users (`time`), which dist-tags point
 * at it right now (latest/stable/maintenance-*…), and last week's downloads
 * (the blast radius of a regression). Versions npm doesn't know (tag pushed
 * before publish, or never published) simply get no enrichment.
 */

export interface NpmVersionInfo {
  publishedAt?: string
  distTags?: string[]
  weeklyDownloads?: number
}

export function npmInfoForTags(
  tagNames: string[],
  data: {
    /** `/-/package/sanity/dist-tags`: dist-tag name → version */
    distTags?: Record<string, string>
    /** packument `time`: version → publish timestamp (plus created/modified) */
    time?: Record<string, string>
    /** `api.npmjs.org/versions/sanity/last-week` `downloads`: version → count */
    downloads?: Record<string, number>
  },
): Map<string, NpmVersionInfo> {
  const tagsByVersion = new Map<string, string[]>()
  for (const [distTag, version] of Object.entries(data.distTags ?? {})) {
    tagsByVersion.set(version, [...(tagsByVersion.get(version) ?? []), distTag])
  }

  const info = new Map<string, NpmVersionInfo>()
  for (const tagName of tagNames) {
    const version = tagName.replace(/^v/, '')
    const publishedAt = data.time?.[version]
    const distTags = tagsByVersion.get(version)
    const weeklyDownloads = data.downloads?.[version]
    if (publishedAt === undefined && distTags === undefined && weeklyDownloads === undefined) {
      continue
    }
    info.set(tagName, {
      ...(publishedAt ? {publishedAt} : {}),
      ...(distTags ? {distTags: distTags.toSorted()} : {}),
      ...(weeklyDownloads === undefined ? {} : {weeklyDownloads}),
    })
  }
  return info
}
