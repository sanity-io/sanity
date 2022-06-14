import {getPackageManagerChoice} from './packageManagerChoice'

export async function getInstallCommand(options: {
  workDir: string
  pkgNames?: string[]
  depType?: 'dev' | 'prod' | 'peer'
}): Promise<string> {
  const {workDir, depType = 'prod', pkgNames} = options
  const {chosen} = await getPackageManagerChoice(workDir, {interactive: false})

  // eg `npm install`, `yarn install`, `pnpm install`
  if (!pkgNames || pkgNames.length === 0) {
    return `${chosen} install`
  }

  const pkgNameString = pkgNames.join(' ')

  if (chosen === 'yarn') {
    const flag = depType === 'dev' || depType === 'peer' ? ` --${depType}` : ''
    return `yarn add ${pkgNameString}${flag}`
  } else if (chosen === 'pnpm') {
    return `pnpm add ${pkgNameString} --save-${depType}`
  }

  return `npm install ${pkgNameString} --save-${depType}`
}
