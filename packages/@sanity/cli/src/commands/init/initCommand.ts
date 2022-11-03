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
  --provider <provider> Login provider to use
  --visibility <mode> Visibility mode for dataset (public/private)
  --create-project <name> Create a new project with the given name
  --project-plan <name> Optionally select a plan for a new project
  --coupon <name> Optionally select a coupon for a new project (cannot be used with --project-plan)
  --reconfigure Reconfigure Sanity studio in current folder with new project/dataset
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
  visibility?: string
  typescript?: boolean
  git?: boolean | string

  'output-path'?: string
  'project-plan'?: string
  'create-project'?: boolean | string
  'dataset-default'?: boolean

  coupon?: string
  reconfigure?: boolean

  organization?: string
}

export const initCommand: CliCommandDefinition<InitFlags> = {
  name: 'init',
  signature: '',
  description: 'Initialize a new Sanity studio project',
  helpText,
  action: (args, context) => {
    const [type] = args.argsWithoutOptions

    if (!type) {
      return initProject(args, context)
    }

    if (type === 'plugin') {
      return context.sanityMajorVersion === 2
        ? initPlugin(args, context)
        : Promise.reject(new Error(`'sanity init plugin' is not available in modern studios`))
    }

    return Promise.reject(new Error(`Unknown init type "${type}"`))
  },
}

export default initCommand
