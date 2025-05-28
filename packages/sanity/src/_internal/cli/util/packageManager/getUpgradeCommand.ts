import {type PackageManager} from './packageManagerChoice'

export function getUpgradeCommand(options: {
  packageManager: PackageManager
  packages: [name: string, version: string][]
}): string {
  const {packageManager, packages} = options
  const upgradePackageArgs = packages.map((pkg) => pkg.join('@')).join(' ')

  // Define commands for known package managers
  switch (packageManager) {
    case 'yarn':
      return `yarn upgrade ${upgradePackageArgs}`
    case 'pnpm':
      return `pnpm update ${upgradePackageArgs}`
    case 'bun':
      return `bun update ${upgradePackageArgs}` // Fixed the command for bun
    case 'npm':
      return `npm install ${upgradePackageArgs}`
    case 'manual':
      return `Manually upgrade the following packages using your preferred package manager: ${upgradePackageArgs}`
    default:
  }
  return `Unsupported package manager ${packageManager}, manually upgrade the following packages using your preferred package manager, e.g. "${packageManager} upgrade ${upgradePackageArgs}"`
}
