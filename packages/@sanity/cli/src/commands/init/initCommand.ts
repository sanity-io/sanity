import {type Framework, frameworks} from '@vercel/frameworks'
import {detectFrameworkRecord, LocalFileSystemDetector} from '@vercel/fs-detectors'

import initProject from '../../actions/init-project/initProject'
import {
  allowedPackageManagersString,
  type PackageManager,
} from '../../packageManager/packageManagerChoice'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices
  --project <projectId> Project ID to use for the studio
  --organization <organizationId> Organization ID to use for the project
  --dataset <dataset> Dataset name for the studio
  --dataset-default Set up a project with a public dataset named "production"
  --output-path <path> Path to write studio project to
  --template <template> Project template to use [default: "clean"]
  --bare Skip the Studio initialization and only print the selected project ID and dataset name to stdout
  --env <filename> Write environment variables to file [default: ".env"]
  --provider <provider> Login provider to use
  --visibility <mode> Visibility mode for dataset (public/private)
  --create-project <name> Create a new project with the given name
  --project-plan <name> Optionally select a plan for a new project
  --coupon <name> Optionally select a coupon for a new project (cannot be used with --project-plan)
  --no-typescript Do not use TypeScript for template files
  --package-manager <name> Specify which package manager to use [allowed: ${allowedPackageManagersString}]
  --no-auto-updates Disable auto updates of studio versions

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
  'y'?: boolean
  'yes'?: boolean
  'project'?: string
  'dataset'?: string
  'template'?: string
  /**
   * Used for accessing private GitHub repo templates
   * @beta
   */
  'template-token'?: string

  'visibility'?: string
  'typescript'?: boolean
  'auto-updates'?: boolean
  /**
   * Used for initializing a project from a server schema that is saved in the Journey API
   * Overrides `project` option.
   * Overrides `dataset` option.
   * Overrides `template` option.
   * Overrides `visibility` option.
   * @beta
   */
  'quickstart'?: string
  'bare'?: boolean
  'env'?: boolean | string
  'git'?: boolean | string

  'output-path'?: string
  'project-plan'?: string
  'create-project'?: boolean | string
  'dataset-default'?: boolean

  'coupon'?: string
  /**
   * @deprecated `--reconfigure` is deprecated - manual configuration is now required
   */
  'reconfigure'?: boolean

  'organization'?: string

  'package-manager'?: PackageManager
}

export const initCommand: CliCommandDefinition<InitFlags> = {
  name: 'init',
  signature: '',
  description: 'Initializes a new Sanity Studio and/or project',
  helpText,
  action: async (args, context) => {
    const [type] = args.argsWithoutOptions

    // `sanity init whatever`
    if (type) {
      return Promise.reject(new Error(`Unknown init type "${type}"`))
    }

    const detectedFramework: Framework | null = await detectFrameworkRecord({
      fs: new LocalFileSystemDetector(process.cwd()),
      frameworkList: frameworks as readonly Framework[],
    })

    return initProject(args, {
      ...context,
      detectedFramework,
    })
  },
}

export default initCommand
