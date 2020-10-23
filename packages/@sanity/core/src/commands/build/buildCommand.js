import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices

Examples
  sanity build
  sanity build --no-minify --source-maps
`

export default {
  name: 'build',
  signature: '[OUTPUT_DIR]',
  description: 'Builds the current Sanity configuration to a static bundle',
  action: lazyRequire(require.resolve('../../actions/build/buildStaticAssets')),
  helpText,
}
