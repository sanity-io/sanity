import {getCrossplatformChangelog} from '../../actions/changelog/getCrossplatformChangelog'
import {type CliCommandDefinition} from '../../types'

interface AllCommandFlags {
  'since'?: string
  'until'?: string
  'limit'?: number
  'output'?: string
  'no-color'?: boolean
}

const helpText = `
Show changelog entries across all Sanity platforms with filtering options.

Options
  --since <date>          Show changes since date (YYYY-MM-DD)
  --until <date>          Show changes until date (YYYY-MM-DD)
  --limit <number>        Maximum number of entries (default: 50)
  --output <file>         Write output to file
  --no-color              Disable colored output

Examples
  # Show all changes since December 1st
  sanity changelog all --since 2024-12-01

  # Show changes in a date range
  sanity changelog all --since 2024-01-01 --until 2024-06-30

  # Limit results
  sanity changelog all --since 2024-12-01 --limit 20

  # Export to file
  sanity changelog all --since 2024-12-01 --output ECOSYSTEM_CHANGES.md
`

const allCommand: CliCommandDefinition<AllCommandFlags> = {
  name: 'all',
  group: 'changelog',
  helpText,
  signature: '[--since <date>] [--until <date>] [--limit <number>] [--output <file>] [--no-color]',
  description: 'Show changelog entries across all platforms',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as AllCommandFlags

    // Validate limit option
    if (flags.limit && (flags.limit < 1 || flags.limit > 200)) {
      output.error('Limit must be between 1 and 200')
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

    await getCrossplatformChangelog(
      {
        since: flags.since,
        until: flags.until,
        limit: flags.limit || 50,
        output: flags.output,
        noColor: flags['no-color'],
        groupBy: 'platform', // Group by platform when using filters
      },
      context,
    )
  },
}

export default allCommand
