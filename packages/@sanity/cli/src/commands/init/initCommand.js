import initProject from '../../actions/init-project/initProject'
import initPlugin from '../../actions/init-plugin/initPlugin'

const helpText = `
Options
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices
  --project <projectId> Project ID to use for the studio
  --dataset <dataset> Dataset name for the studio
  --output-path <path> Path to write studio project to
  --template <template> Project template to use [default: "clean"]
  --visibility <mode> Visibility mode for dataset (public/private)
  --create-project <name> Create a new project with the given name

Examples
  # Initialize a new project, prompt for required information along the way
  sanity init

  # Initialize a new plugin
  sanity init plugin

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

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project or plugin',
  helpText,
  action: (args, context) => {
    const [type] = args.argsWithoutOptions

    if (!type) {
      return initProject(args, context)
    }

    if (type === 'plugin') {
      return initPlugin(args, context)
    }

    return Promise.reject(new Error(`Unknown init type "${type}"`))
  }
}
