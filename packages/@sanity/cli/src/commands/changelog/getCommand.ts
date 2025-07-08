import {getChangelog} from '../../actions/changelog/getChangelog'
import {type CliCommandDefinition} from '../../types'
import {isInteractive} from '../../util/isInteractive'

interface GetCommandFlags {
  'from'?: string
  'to'?: string
  'since'?: string
  'until'?: string
  'limit'?: number
  'output'?: string
  'no-color'?: boolean
}

const helpText = `
Arguments
  <platform>              NPM package name or platform title

Options
  --from <version>        Start version (inclusive)
  --to <version>          End version (inclusive)
  --since <date>          Show changes since date (YYYY-MM-DD)
  --until <date>          Show changes until date (YYYY-MM-DD)
  --limit <number>        Number of entries to show (default: 10)
  --output <file>         Write output to file
  --no-color              Disable colored output

Examples
  # Show recent changes for Sanity Studio
  sanity changelog get sanity

  # Show changes for a specific NPM package
  sanity changelog get @sanity/client

  # Show changes between versions
  sanity changelog get @sanity/client --from 2.0.0 --to 3.0.0

  # Show changes since a date
  sanity changelog get sanity --since 2024-01-01

  # Export changelog to file
  sanity changelog get sanity --since 2024-01-01 --output CHANGELOG.md
`

const getCommand: CliCommandDefinition<GetCommandFlags> = {
  name: 'get',
  group: 'changelog',
  helpText,
  signature:
    '<platform> [--from <version>] [--to <version>] [--since <date>] [--until <date>] [--limit <number>] [--output <file>] [--no-color]',
  description: 'Get changelog entries for a platform',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as GetCommandFlags
    const platform = args.argsWithoutOptions[0]

    if (!platform || typeof platform !== 'string') {
      output.error('Please provide a platform name')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    // Validate limit option
    if (flags.limit && (flags.limit < 1 || flags.limit > 100)) {
      output.error('Limit must be between 1 and 100')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (flags.since && !dateRegex.test(flags.since)) {
      output.error('Invalid date format for --since. Use YYYY-MM-DD format')
      process.exit(1)
      return
    }
    if (flags.until && !dateRegex.test(flags.until)) {
      output.error('Invalid date format for --until. Use YYYY-MM-DD format')
      process.exit(1)
      return
    }

    if (isInteractive) {
      process.stderr.write(`Fetching changelog for ${platform}...\n`)
    }

    const changelog = await getChangelog(
      {
        platform,
        from: flags.from,
        to: flags.to,
        since: flags.since,
        until: flags.until,
        limit: flags.limit,
        output: flags.output,
        noColor: flags['no-color'],
      },
      context,
    )

    // If output file is specified, write to file
    if (flags.output && changelog.length > 0) {
      const fs = await import('fs')
      const path = await import('path')

      // Create directory if it doesn't exist
      const dir = path.dirname(flags.output)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true})
      }

      // Re-format for file output (always markdown)
      let content = `# ${changelog[0].platform.title} Changelog\n\n`
      changelog.forEach((entry) => {
        const date = new Date(entry.date).toLocaleDateString()
        // For date-based versions (like v2021-06-07), don't show date twice
        const showDate =
          !entry.version.startsWith('v') || !entry.version.match(/^v\d{4}-\d{2}-\d{2}$/)
        content += showDate ? `## ${entry.version} (${date})\n\n` : `## ${entry.version}\n\n`
        if (entry.summary) {
          content += `${entry.summary}\n\n`
        }
        if (entry.changes && entry.changes.length > 0) {
          entry.changes.forEach((change) => {
            content += `### ${change.title}\n\n`
            const changeContent = change.content
              .map((block) => block.children?.map((child: any) => child.text || '').join('') || '')
              .join('\n')
            if (changeContent) {
              content += `${changeContent}\n\n`
            }

            // Add affected documentation if available
            if (change.affectedArticles && change.affectedArticles.length > 0) {
              const validArticles = change.affectedArticles.filter(
                (article) => article && article.title && article.title !== 'undefined',
              )

              if (validArticles.length > 0) {
                content += `**Affected documentation:**\n\n`
                validArticles.forEach((article) => {
                  content += `- [${article.title}](/docs/${article.slug})\n`
                })
                content += '\n'
              }
            }
          })
        }
        content += '---\n\n'
      })

      fs.writeFileSync(flags.output, content)
      output.print(`\nChangelog written to ${flags.output}`)
    }
  },
}

export default getCommand
