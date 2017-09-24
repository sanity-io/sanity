import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices
  --project <projectId> Project ID to use for the studio
  --dataset <dataset> Dataset name for the studio
  --output-path <path> Path to write studio project to
  --template <template> Project template to use [default: "clean"]

Examples
  sanity init -y --project abc123 --dataset production --output-path ~/myproj
  sanity init -y --project abc123 --dataset staging --template moviedb --output-path .
`

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: lazyRequire(require.resolve('./initAction')),
  helpText
}
