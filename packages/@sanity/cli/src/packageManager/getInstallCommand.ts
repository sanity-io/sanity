import {getPackageManagerChoice} from './packageManagerChoice'

export async function getInstallCommand(options: {
  workDir: string
  pkgNames: string[]
  depType?: 'dev' | 'prod' | 'peer'
}): Promise<string> {
  const {workDir, depType = 'prod', pkgNames} = options
  const {chosen} = await getPackageManagerChoice(workDir, {interactive: false})
  const pkgNameString = pkgNames.join(' ')

  if (chosen === 'yarn') {
    const flag = depType === 'dev' || depType === 'peer' ? ` --${depType}` : ''
    return `yarn add ${pkgNameString}${flag}`
  } else if (chosen === 'pnpm') {
    // @todo what does pnpm use for saving?
    return `pnpm add ${pkgNameString}`
  }

  return `npm install ${pkgNameString} --save-${depType}`
}
