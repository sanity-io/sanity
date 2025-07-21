import chalk from 'chalk'

import {searchDocs, type SearchResult} from '../../actions/docs/searchDocs'
import {type CliCommandDefinition} from '../../types'
import {isInteractive} from '../../util/isInteractive'

interface SearchCommandFlags {
  limit?: number
}

const helpText = `
Arguments
  <query> Search query for documentation

Options
  --limit <limit>   Maximum number of results to return [default: 10]

Examples
  # Search for documentation about schemas
  sanity docs search schema

  # Search with phrase
  sanity docs search "groq functions"

  # Limit search results
  sanity docs search "deployment" --limit=5
`

const defaultFlags = {
  limit: 10,
}

const searchCommand: CliCommandDefinition<SearchCommandFlags> = {
  name: 'search',
  group: 'docs',
  helpText,
  signature: '<query> [--limit <limit>]',
  description: 'Search Sanity docs',
  async action(args, context) {
    const {output, prompt} = context
    const flags = {...defaultFlags, ...args.extOptions}
    const query = args.argsWithoutOptions[0]

    if (!query) {
      output.error('Please provide a search query')
      output.print('Usage: sanity docs search "your query"')
      process.exit(1)
      return
    }

    output.print(`Searching documentation for: "${query}"`)

    let results: SearchResult[]
    try {
      results = await searchDocs(
        {
          query,
          limit: flags.limit,
        },
        context,
      )

      if (results.length === 0) {
        output.print('No results found. Try a different search term.')
        return
      }
    } catch (error) {
      // Graceful error handling
      output.error('The documentation search API is currently unavailable. Please try again later.')
      process.exit(1)
      return
    }

    output.print(`\nFound ${results.length} result(s):\n`)

    results.forEach((result, index) => {
      output.print(`${index + 1}. ${result.title}`)
      output.print(`   ${chalk.cyan(`URL: https://www.sanity.io${result.path}`)}`)
      if (result.description) {
        output.print(`   ${result.description}`)
      }
      output.print('')
    })

    // Show usage hint in non-interactive mode
    if (!isInteractive) {
      output.print('Use `sanity docs read <url>` to read an article in terminal.')
      output.print('Use `sanity docs read <path>` to follow links found within articles.')
      output.print('')
    }

    // Interactive selection (only in interactive environments)
    if (results.length > 1 && isInteractive) {
      const choices = results.map((result, index) => ({
        name: `${index + 1}. ${result.title} (${result.path})`,
        value: index,
        short: result.title,
      }))

      try {
        const selectedIndex = await prompt.single({
          type: 'list',
          message: 'Select an article to read in terminal:',
          choices: [...choices, {name: 'Exit', value: -1, short: 'Exit'}],
        })

        if (typeof selectedIndex === 'number' && selectedIndex >= 0) {
          const selected = results[selectedIndex]

          // Read and display the article
          const {readDoc} = await import('../../actions/docs/readDoc')
          const content = await readDoc({path: selected.path}, context)

          if (content) {
            output.print('\n---\n')
            output.print(content)
          }
        }
      } catch (error) {
        // User cancelled or other error, just continue
      }
    }
  },
}

export default searchCommand
