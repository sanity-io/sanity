import chalk from 'chalk'
import type {CliCommandDefinition} from '@sanity/cli'

const description = `Downloads and validates all document specified in a workspace (beta)${chalk.cyan(
  '*',
)}.

${chalk.cyan('*')}Note: As it's currently in beta, some features may not be fully stable.
We encourage users to report any issues encountered to help us improve.
Thank you for your understanding and support!

https://github.com/sanity-io/sanity/issues/5510
`

const helpText = `
Options
  -y, --yes Skips the first confirmation prompt
  --workspace <name> The name of the workspace to use when downloading and validating all documents
  --dataset <name> Override the dataset used. By default, this is derived from the given workspace
  --format <pretty|ndjson|json> The output format used to print the found validation markers and report progress
  --level <error|warning|info> The minimum level reported out. Defaults to warning.
  --max-custom-validation-concurrent <number> Specify how many custom validators can run concurrently. Defaults to 5.

Examples
  # Validates all documents in a sanity project with one workspace
  sanity documents validate --workspace default

  # Override the dataset specified in the workspace
  sanity documents validate --workspace default --dataset staging

  # Save the results of the report into a file
  sanity documents validate > report.txt

  # Report out info level validation markers too
  sanity document validate --level info
`

const validateDocumentsCommand: CliCommandDefinition = {
  name: 'validate',
  group: 'documents',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/validation/validateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default validateDocumentsCommand
