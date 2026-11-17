/**
 * Pure mapping of npm registry responses onto git tags (I/O lives in
 * syncGitHistory.ts). Tag `vX.Y.Z` = `sanity@X.Y.Z`; npm adds what git can't
 * know: publish time, current dist-tags, last week's downloads (the blast
 * radius of a regression) and whether the version is deprecated on npm.
 * Versions npm doesn't know get no enrichment.
 */

export interface NpmVersionInfo {
  publishedAt?: string
  distTags?: string[]
  weeklyDownloads?: number
  /** The npm deprecation message — present only while the version is deprecated. */
  deprecated?: string
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
    /** packument `versions`: version → manifest; `deprecated` is the message */
    versions?: Record<string, {deprecated?: string}>
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
    // `npm deprecate <pkg>@<v> ""` undeprecates by writing an empty message,
    // so an empty string means "not deprecated" too
    const deprecated = data.versions?.[version]?.deprecated || undefined
    if (
      publishedAt === undefined &&
      distTags === undefined &&
      weeklyDownloads === undefined &&
      deprecated === undefined
    ) {
      continue
    }
    info.set(tagName, {
      ...(publishedAt ? {publishedAt} : {}),
      ...(distTags ? {distTags: distTags.toSorted()} : {}),
      ...(weeklyDownloads === undefined ? {} : {weeklyDownloads}),
      ...(deprecated ? {deprecated} : {}),
    })
  }
  return info
}
