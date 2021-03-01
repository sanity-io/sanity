import upgradeDependencies from './upgradeDependencies'

const help = `
Upgrades installed Sanity modules to the latest available version within the
semantic versioning range specified in "package.json".

If a specific module name is provided, only that module will be upgraded.

If the --save-exact option is given, the new version will be saved without the
^-prefix in package.json.
`

export default {
  name: 'upgrade',
  signature: '[MODULE_NAME] [--tag DIST_TAG] [--range SEMVER_RANGE] [--save-exact]',
  description: 'Upgrades all (or some) Sanity modules to their latest versions',
  action: upgradeDependencies,
  helpText: help,
}
