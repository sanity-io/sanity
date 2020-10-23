import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  --no-build Don't build the studio prior to deploy, instead deploying the version currently in \`dist/\`

Examples
  sanity deploy
  sanity deploy --no-minify --source-maps
`

export default {
  name: 'deploy',
  signature: '[SOURCE_DIR] [--no-build]  [--source-maps] [--no-minify]',
  description: 'Deploys a statically built Sanity studio',
  action: lazyRequire(require.resolve('../../actions/deploy/deployAction')),
  helpText,
}
