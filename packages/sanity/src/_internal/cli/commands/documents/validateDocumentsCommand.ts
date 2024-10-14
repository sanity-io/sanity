import {type CliCommandDefinition} from '@sanity/cli'

const description = `Downloads and validates all document specified in a workspace`

const helpText = `
Options
  -y, --yes Skips the first confirmation prompt.
  --workspace <name> The name of the workspace to use when downloading and validating all documents.
  --dataset <name> Override the dataset used. By default, this is derived from the given workspace.
  --file <filepath> Provide a path to either an .ndjson file or a tarball containing an .ndjson file.
  --format <pretty|ndjson|json> The output format used to print the found validation markers and report progress.
  --level <error|warning|info> The minimum level reported out. Defaults to warning.
  --max-custom-validation-concurrency <number> Specify how many custom validators can run concurrently. Defaults to 5.
  --max-fetch-concurrency <number> Specify how many \`client.fetch\` requests are allow concurrency at once. Defaults to 25.

Examples
  # Validates all documents in a Sanity project with more than one workspace
  sanity documents validate --workspace default

  # Override the dataset specified in the workspace
  sanity documents validate --workspace default --dataset staging

  # Save the results of the report into a file
  sanity documents validate --yes > report.txt

  # Report out info level validation markers too
  sanity documents validate --level info
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
