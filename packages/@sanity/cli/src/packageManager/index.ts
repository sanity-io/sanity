import {getInstallCommand} from './getInstallCommand'
import {getCliUpgradeCommand} from './getUpgradeCommand'
import {installDeclaredPackages, installNewPackages} from './installPackages'
import {getPackageManagerChoice} from './packageManagerChoice'
import {uninstallPackages} from './uninstallPackages'
import {getYarnStub} from './yarnStub'

// Exported for internal CLI usage
export {
  getCliUpgradeCommand,
  getInstallCommand,
  getPackageManagerChoice,
  getYarnStub,
  installDeclaredPackages,
  installNewPackages,
  uninstallPackages,
}

// Exported for use in `sanity` (formerly `@sanity/core`)

/**
 * @internal
 */
export const cliPackageManager = {
  getInstallCommand,
  getPackageManagerChoice,
  installNewPackages,
}

/**
 * @internal
 */
export type CliPackageManager = typeof cliPackageManager
