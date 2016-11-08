import lazyRequire from '@sanity/util/lib/lazyRequire'

const help = `
Upgrades installed Sanity modules to the latest available version within the
semantic versioning range specified in "package.json".

If a specific module name is provided, only that module will be upgraded.
`

export default {
  name: 'upgrade',
  signature: '[MODULE_NAME]',
  description: 'Upgrades all (or some) Sanity modules to their latest versions',
  action: lazyRequire(require.resolve('./upgradeDependencies')),
  helpText: help
}
