/**
 * Pure mapping of npm registry responses onto git tags (I/O lives in
 * syncGitHistory.ts). Tag `vX.Y.Z` = `sanity@X.Y.Z`; npm adds what git can't
 * know: publish time, current dist-tags, and last week's downloads (the
 * blast radius of a regression). Versions npm doesn't know get no
 * enrichment.
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
