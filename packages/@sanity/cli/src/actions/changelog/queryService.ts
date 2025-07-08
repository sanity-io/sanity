import {type CliCommandContext} from '../../types'

// Types for the API response structures
export interface ApiPlatform {
  _id: string
  title: string
  npmName?: string
  endpoint?: string
}

export interface ApiVersion {
  _id: string
  semver: string
  date: string
  summary: string
  platform: {
    _ref: string
  }
}

export interface ApiChange {
  _id: string
  title: string
  content: any[] // Portable Text blocks
  publishedAt: string
  version: {
    _ref: string
  }
  affectedArticles?: Array<{
    title: string
    slug: string
    url: string
  }>
}

export interface ChangelogEntry {
  platform: {
    title: string
    npmName?: string
    endpoint?: string
  }
  version: string
  date: string
  summary: string
  changes?: Array<{
    title: string
    content: any[]
    publishedAt: string
    affectedArticles?: Array<{
      title: string
      slug: string
      url: string
    }>
  }>
}

export interface GetChangelogOptions {
  platform?: string
  from?: string
  to?: string
  since?: string
  until?: string
  limit?: number
  version?: string
}

const SANITY_API_BASE = 'https://3do82whm.api.sanity.io/v2025-07-08/data/query/next'

export async function queryAPI(query: string, params: Record<string, any> = {}): Promise<any> {
  const url = new URL(SANITY_API_BASE)
  url.searchParams.set('query', query)

  // Add parameters to the query URL if any
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(url.toString(), {
    headers: {
      // TODO: Add proper authentication token
      // Authorization: 'Bearer <token>',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Sanity API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.result
}

export async function listPlatforms(context: CliCommandContext): Promise<ApiPlatform[]> {
  const query = `*[_type == "apiPlatform"] | order(title asc) {
    _id,
    title,
    npmName,
    endpoint
  }`

  try {
    return await queryAPI(query)
  } catch (error) {
    context.output.error('Failed to fetch platforms from Sanity API')
    throw error
  }
}

export async function findPlatformByName(
  name: string,
  context: CliCommandContext,
): Promise<ApiPlatform | null> {
  const query = `*[_type == "apiPlatform" && (npmName == $name || title == $name)][0] {
    _id,
    title,
    npmName,
    endpoint
  }`

  try {
    return await queryAPI(query, {name})
  } catch (error) {
    context.output.error('Failed to fetch platform from Sanity API')
    throw error
  }
}

export async function getChangelog(
  options: GetChangelogOptions,
  context: CliCommandContext,
): Promise<ChangelogEntry[]> {
  if (!options.platform) {
    throw new Error('Platform is required')
  }

  // First, find the platform
  const platform = await findPlatformByName(options.platform, context)
  if (!platform) {
    throw new Error(`Platform "${options.platform}" not found`)
  }

  // Build version query with filters
  let versionQuery = `*[_type == "apiVersion" && platform._ref == $platformId`
  const params: Record<string, any> = {platformId: platform._id}

  if (options.version) {
    versionQuery += ` && semver == $version`
    params.version = options.version
  }

  if (options.since) {
    versionQuery += ` && date >= $since`
    params.since = options.since
  }

  if (options.until) {
    versionQuery += ` && date <= $until`
    params.until = options.until
  }

  versionQuery += `] | order(date desc, semver desc)`

  if (options.limit) {
    versionQuery += `[0..${options.limit - 1}]`
  } else {
    versionQuery += `[0..19]` // Default limit of 20
  }

  versionQuery += ` {
    _id,
    semver,
    date,
    summary,
    "changes": *[_type == "apiChange" && version._ref == ^._id] {
      _id,
      title,
      content[]{
        ...,
        _type == "muxVideo" => {
          ...,
          video {
            asset-> {
              playbackId
            }
          }
        }
      },
      publishedAt,
      affectedArticles[]-> {
        title,
        "slug": slug.current,
        url
      }
    }
  }`

  try {
    const versions: (ApiVersion & {changes: ApiChange[]})[] = await queryAPI(versionQuery, params)

    // Sort by date first, then by semver (both descending)
    const sortedVersions = versions.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)

      // Primary sort: date descending
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime()
      }

      // Secondary sort: semver descending (only if both have semver)
      if (a.semver && b.semver) {
        return b.semver.localeCompare(a.semver, undefined, {numeric: true, sensitivity: 'base'})
      }

      // If no semver, just keep date order
      return 0
    })

    return sortedVersions.map((version) => ({
      platform: {
        title: platform.title,
        npmName: platform.npmName,
        endpoint: platform.endpoint,
      },
      version: version.semver || `v${version.date}`,
      date: version.date,
      summary: version.summary,
      changes: version.changes?.map((change) => ({
        title: change.title,
        content: change.content,
        publishedAt: change.publishedAt,
        affectedArticles: change.affectedArticles,
      })),
    }))
  } catch (error) {
    context.output.error('Failed to fetch changelog from Sanity API')
    throw error
  }
}
