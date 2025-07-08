import {getCrossplatformChangelog} from '../../actions/changelog/getCrossplatformChangelog'
import {type CliCommandDefinition} from '../../types'

interface RecentCommandFlags {
  'limit'?: number
  'output'?: string
  'no-color'?: boolean
}

const helpText = `
Show recent changes across all Sanity platforms.

Options
  --limit <number>        Number of days to look back (default: 7)
  --output <file>         Write output to file
  --no-color              Disable colored output

Examples
  # Show changes from the last week
  sanity changelog recent

  # Show changes from the last 30 days
  sanity changelog recent --limit 30

  # Export recent changes to file
  sanity changelog recent --output RECENT_CHANGES.md
`

const recentCommand: CliCommandDefinition<RecentCommandFlags> = {
  name: 'recent',
  group: 'changelog',
  helpText,
  signature: '[--limit <days>] [--output <file>] [--no-color]',
  description: 'Show recent changes across all platforms',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as RecentCommandFlags

    // Validate limit option
    if (flags.limit && (flags.limit < 1 || flags.limit > 365)) {
      output.error('Limit must be between 1 and 365 days')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    const daysBack = flags.limit || 7
    const since = new Date()
    since.setDate(since.getDate() - daysBack)
    const sinceDate = since.toISOString().split('T')[0] // YYYY-MM-DD format

    await getCrossplatformChangelog(
      {
        since: sinceDate,
        limit: 50, // Reasonable limit for recent changes
        output: flags.output,
        noColor: flags['no-color'],
        groupBy: 'date', // Group by date for recent view
      },
      context,
    )
  },
}

export default recentCommand
