import {type CliCommandContext} from '../../types'
import {
  getChangelog as queryGetChangelog,
  type GetChangelogOptions,
  type ChangelogEntry,
} from './queryService'
import {isInteractive} from '../../util/isInteractive'
import {markdownSerializer} from './markdownSerializer'
import {colorizeMarkdown} from './terminalMarkdown'

export interface GetChangelogActionOptions extends GetChangelogOptions {
  output?: string
  noColor?: boolean
}

// Convert Portable Text blocks to markdown string
function portableTextToMarkdown(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  return markdownSerializer(blocks).trim()
}

function formatChangelogEntry(entry: ChangelogEntry, noColor: boolean): string {
  const date = new Date(entry.date).toLocaleDateString()
  const version = entry.version
  const summary = entry.summary || ''

  // For date-based versions (like v2021-06-07), don't show date twice
  const showDate = !version.startsWith('v') || !version.match(/^v\d{4}-\d{2}-\d{2}$/)

  // Always use markdown format
  let result = showDate ? `## ${version} (${date})\n\n` : `## ${version}\n\n`

  if (summary) {
    result += `${summary}\n\n`
  }

  if (entry.changes && entry.changes.length > 0) {
    entry.changes.forEach((change) => {
      result += `### ${change.title}\n\n`

      const content = portableTextToMarkdown(change.content)
      if (content) {
        result += `${content}\n\n`
      }

      if (change.affectedArticles && change.affectedArticles.length > 0) {
        // Filter out undefined or empty titles
        const validArticles = change.affectedArticles.filter(
          (article) => article && article.title && article.title !== 'undefined',
        )

        if (validArticles.length > 0) {
          result += `**Affected documentation:**\n\n`
          validArticles.forEach((article) => {
            result += `- [${article.title}](/docs/${article.slug})\n`
          })
          result += '\n'
        }
      }
    })
  }

  result += '---\n\n'

  // Apply terminal colorization if in interactive mode
  return colorizeMarkdown(result, noColor)
}

export async function getChangelog(
  options: GetChangelogActionOptions,
  context: CliCommandContext,
): Promise<ChangelogEntry[]> {
  const {output} = context

  try {
    const changelog = await queryGetChangelog(options, context)

    if (changelog.length === 0) {
      output.print('No changelog entries found.')
      return changelog
    }

    // Show platform info
    if (changelog.length > 0) {
      const platform = changelog[0].platform
      let header = `${platform.title} changelog:`
      if (platform.npmName) {
        header = `${platform.npmName} changelog:`
      }
      output.print(`\n${header}\n`)
    }

    // Format and display entries (always markdown)
    changelog.forEach((entry) => {
      const formatted = formatChangelogEntry(entry, options.noColor || false)
      output.print(formatted)
    })

    return changelog
  } catch (error) {
    if (error instanceof Error) {
      output.error(error.message)
    } else {
      output.error('Failed to fetch changelog')
    }
    process.exit(1)
  }
}
