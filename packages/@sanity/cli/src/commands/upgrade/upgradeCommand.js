import {prefixCommand} from '../../util/isNpx'
import upgradeDependencies from './upgradeDependencies'

const commandPrefix = prefixCommand()

const helpText = `
Upgrades installed Sanity studio modules to the latest available version within
the semantic versioning range specified in "package.json".

If a specific module name is provided, only that module will be upgraded.

Options
  --range [range] Version range to upgrade to, eg '^2.2.7' or '2.1.x'
  --tag [tag]     Tagged release to upgrade to, eg 'canary' or 'some-feature'
  --save-exact    Pin the resolved version numbers in package.json (no ^ prefix)

Examples
  # Upgrade modules to the latest semver compatible versions
  ${commandPrefix} upgrade

  # Update to the latest within the 2.2 range
  ${commandPrefix} upgrade --range 2.2.x

  # Update to the latest semver compatible versions and pin the versions
  ${commandPrefix} upgrade --save-exact

  # Update to the latest 'canary' npm tag
  ${commandPrefix} upgrade --tag canary
`

export default {
  name: 'upgrade',
  signature: '[--tag DIST_TAG] [--range SEMVER_RANGE] [--save-exact]',
  description: 'Upgrades all (or some) Sanity modules to their latest versions',
  action: upgradeDependencies,
  helpText,
}
