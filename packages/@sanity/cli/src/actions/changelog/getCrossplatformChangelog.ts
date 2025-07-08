import {type CliCommandContext} from '../../types'
import {queryAPI, type ChangelogEntry} from './queryService'
import {isInteractive} from '../../util/isInteractive'
import {markdownSerializer} from './markdownSerializer'

export interface CrossplatformChangelogOptions {
  since?: string
  until?: string
  limit?: number
  output?: string
  noColor?: boolean
  groupBy: 'date' | 'platform'
}

function formatCrossplatformEntries(
  entries: ChangelogEntry[],
  groupBy: 'date' | 'platform',
  noColor: boolean,
): string {
  if (entries.length === 0) {
    return 'No changelog entries found.'
  }

  let result = ''

  if (groupBy === 'date') {
    // Group by date and sort chronologically (newest first)
    const entriesByDate = new Map<string, ChangelogEntry[]>()

    entries.forEach((entry) => {
      const date = entry.date
      if (!entriesByDate.has(date)) {
        entriesByDate.set(date, [])
      }
      entriesByDate.get(date)!.push(entry)
    })

    // Sort dates newest first
    const sortedDates = Array.from(entriesByDate.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )

    result += `Recent Sanity Changelog:\n\n`

    sortedDates.forEach((date) => {
      const dateEntries = entriesByDate.get(date)!
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      result += `## ${formattedDate}\n\n`

      dateEntries.forEach((entry) => {
        const platformName = entry.platform.npmName || entry.platform.title

        // Only show version for npm packages or HTTP APIs (endpoints)
        if (entry.platform.npmName || entry.platform.endpoint) {
          result += `### ${platformName} ${entry.version}\n\n`
        } else {
          result += `### ${platformName}\n\n`
        }

        if (entry.summary) {
          result += `${entry.summary}\n\n`
        }

        // Include change details for more content
        if (entry.changes && entry.changes.length > 0) {
          entry.changes.forEach((change) => {
            result += `**${change.title}**\n\n`
            const content = markdownSerializer(change.content).trim()
            if (content) {
              result += `${content}\n\n`
            }
          })
        }

        result += '---\n\n'
      })
    })
  } else {
    // Group by platform
    const entriesByPlatform = new Map<string, ChangelogEntry[]>()

    entries.forEach((entry) => {
      const platformKey = entry.platform.npmName || entry.platform.title
      if (!entriesByPlatform.has(platformKey)) {
        entriesByPlatform.set(platformKey, [])
      }
      entriesByPlatform.get(platformKey)!.push(entry)
    })

    // Sort platforms alphabetically
    const sortedPlatforms = Array.from(entriesByPlatform.keys()).sort()

    result += `Sanity Ecosystem Changelog:\n\n`

    sortedPlatforms.forEach((platformKey) => {
      const platformEntries = entriesByPlatform.get(platformKey)!
      // Sort entries by date descending within each platform
      platformEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      result += `## ${platformKey}\n\n`

      platformEntries.forEach((entry) => {
        const date = new Date(entry.date).toLocaleDateString()
        const showDate =
          !entry.version.startsWith('v') || !entry.version.match(/^v\d{4}-\d{2}-\d{2}$/)

        // Only show version for npm packages or HTTP APIs (endpoints)
        if (entry.platform.npmName || entry.platform.endpoint) {
          if (showDate) {
            result += `### ${entry.version} (${date})\n\n`
          } else {
            result += `### ${entry.version}\n\n`
          }
        } else {
          result += `### ${date}\n\n`
        }

        if (entry.summary) {
          result += `${entry.summary}\n\n`
        }

        // Include change details for more content
        if (entry.changes && entry.changes.length > 0) {
          entry.changes.forEach((change) => {
            result += `**${change.title}**\n\n`
            const content = markdownSerializer(change.content).trim()
            if (content) {
              result += `${content}\n\n`
            }
          })
        }
      })

      result += '---\n\n'
    })
  }

  return result
}

export async function getCrossplatformChangelog(
  options: CrossplatformChangelogOptions,
  context: CliCommandContext,
): Promise<void> {
  const {output} = context

  try {
    if (isInteractive) {
      process.stderr.write('Fetching recent changelog entries...\n')
    }

    // Build version query to get all versions with their platform info and changes
    let versionQuery = `*[_type == "apiVersion"`
    const params: Record<string, any> = {}

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
      versionQuery += `[0..49]` // Default limit of 50 for cross-platform
    }

    versionQuery += ` {
      _id,
      semver,
      date,
      summary,
      platform-> {
        _id,
        title,
        npmName,
        endpoint
      },
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

    const versions = await queryAPI(versionQuery, params)

    if (!versions || versions.length === 0) {
      output.print('No changelog entries found matching the criteria.')
      return
    }

    // Transform to ChangelogEntry format
    const allEntries: ChangelogEntry[] = versions.map((version: any) => ({
      platform: {
        title: version.platform.title,
        npmName: version.platform.npmName,
        endpoint: version.platform.endpoint,
      },
      version: version.semver || `v${version.date}`,
      date: version.date,
      summary: version.summary,
      changes: version.changes?.map((change: any) => ({
        title: change.title,
        content: change.content,
        publishedAt: change.publishedAt,
        affectedArticles: change.affectedArticles,
      })),
    }))

    // Format and display
    const formatted = formatCrossplatformEntries(
      allEntries,
      options.groupBy,
      options.noColor || false,
    )
    output.print(`\n${formatted}`)

    // Handle file output
    if (options.output) {
      const fs = await import('fs')
      const path = await import('path')

      // Create directory if it doesn't exist
      const dir = path.dirname(options.output)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true})
      }

      // Write clean markdown to file (no colorization)
      const cleanFormatted = formatCrossplatformEntries(allEntries, options.groupBy, true)
      fs.writeFileSync(options.output, cleanFormatted)
      output.print(`\nChangelog written to ${options.output}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      output.error(error.message)
    } else {
      output.error('Failed to fetch cross-platform changelog')
    }
    process.exit(1)
  }
}
