import {type Framework, frameworks} from '@vercel/frameworks'
import {LocalFileSystemDetector, detectFrameworkRecord} from '@vercel/fs-detectors'
import initProject from '../../actions/init-project/initProject'
import initPlugin from '../../actions/init-plugin/initPlugin'
import {CliCommandDefinition} from '../../types'

const helpText = `
Options
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices
  --project <projectId> Project ID to use for the studio
  --organization <organizationId> Organization ID to use for the project
  --dataset <dataset> Dataset name for the studio
  --dataset-default Set up a project with a public dataset named "production"
  --output-path <path> Path to write studio project to
  --template <template> Project template to use [default: "clean"]
  --schemaId <schemaId>: Init studio from a Schema Builder schema. Start your schema design at: https://schema.club. (alpha)
  --bare Skip the Studio initialization and only print the selected project ID and dataset name to stdout
  --env <filename> Write environment variables to file [default: ".env"]
  --provider <provider> Login provider to use
  --visibility <mode> Visibility mode for dataset (public/private)
  --create-project <name> Create a new project with the given name
  --project-plan <name> Optionally select a plan for a new project
  --coupon <name> Optionally select a coupon for a new project (cannot be used with --project-plan)
  --no-typescript Do not use TypeScript for template files

Examples
  # Initialize a new project, prompt for required information along the way
  sanity init

  # Initialize a new project with a public dataset named "production"
  sanity init --dataset-default

  # Initialize a project with the given project ID and dataset to the given path
  sanity init -y --project abc123 --dataset production --output-path ~/myproj

  # Initialize a project with the given project ID and dataset using the moviedb
  # template to the given path
  sanity init -y --project abc123 --dataset staging --template moviedb --output-path .

  # Create a brand new project with name "Movies Unlimited"
  sanity init -y \\
    --create-project "Movies Unlimited" \\
    --dataset moviedb \\
    --visibility private \\
    --template moviedb \\
    --output-path /Users/espenh/movies-unlimited
`

export interface InitFlags {
  y?: boolean
  yes?: boolean
  project?: string
  dataset?: string
  template?: string
  schemaId?: string
  visibility?: string
  typescript?: boolean
  bare?: boolean
  env?: boolean | string
  git?: boolean | string

  'output-path'?: string
  'project-plan'?: string
  'create-project'?: boolean | string
  'dataset-default'?: boolean

  coupon?: string
  /**
   * @deprecated `--reconfigure` is deprecated - manual configuration is now required
   */
  reconfigure?: boolean

  organization?: string
}

export const initCommand: CliCommandDefinition<InitFlags> = {
  name: 'init',
  signature: '',
  description: 'Initialize a new Sanity Studio project',
  helpText,
  action: async (args, context) => {
    const {output, chalk, prompt} = context
    const [type] = args.argsWithoutOptions
    const unattended = args.extOptions.y || args.extOptions.yes

    const warn = (msg: string) => output.warn(chalk.yellow.bgBlack(msg))

    // `sanity init plugin`
    if (type === 'plugin') {
      return context.sanityMajorVersion === 2
        ? initPlugin(args, context)
        : Promise.reject(new Error(`'sanity init plugin' is not available in modern studios`))
    }

    // `sanity init whatever`
    if (type) {
      return Promise.reject(new Error(`Unknown init type "${type}"`))
    }

    // `npm create sanity` (regular v3 init)

    const detectedFramework: Framework | null = await detectFrameworkRecord({
      fs: new LocalFileSystemDetector(process.cwd()),
      frameworkList: frameworks as readonly Framework[],
    })

    if (
      args.argv.includes('--from-create') ||
      args.argv.includes('--env') ||
      args.argv.includes('--bare') ||
      detectedFramework?.slug === 'nextjs'
    ) {
      return initProject(args, context)
    }

    // `sanity init` (v2 style)
    warn('╭────────────────────────────────────────────────────────────╮')
    warn('│                                                            │')
    warn("│  Welcome to Sanity! It looks like you're following         │")
    warn('│  instructions for Sanity Studio v2, but the version you    │')
    warn('│  have installed is the latest - Sanity Studio v3.          │')
    warn('│                                                            │')
    warn('│  In Sanity Studio v3, new projects are created by running  │')
    warn('│  [npm create sanity@latest]. For more information, see     │')
    warn('│   https://www.sanity.io/help/studio-v2-vs-v3               │')
    warn('│                                                            │')
    warn('╰────────────────────────────────────────────────────────────╯')
    warn('') // Newline to separate from other output

    const continueV3Init = unattended
      ? true
      : await prompt.single({
          message: 'Continue creating a Sanity Studio v3 project?',
          type: 'confirm',
        })

    // Fall back
    if (!continueV3Init) {
      // Indicate that the operation did not succeed as expected
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }

    const returnVal = await initProject(args, context)

    warn('╭────────────────────────────────────────────────────────────╮')
    warn('│                                                            │')
    warn('│  To learn how commands have changed from Studio v2 to v3,  │')
    warn('│  see https://www.sanity.io/help/studio-v2-vs-v3            │')
    warn('│                                                            │')
    warn('╰────────────────────────────────────────────────────────────╯')
    warn('') // Newline to separate from other output

    return returnVal
  },
}

export default initCommand
