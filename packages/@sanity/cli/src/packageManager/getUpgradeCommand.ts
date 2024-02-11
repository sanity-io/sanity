import path from 'path'
import isInstalledGlobally from 'is-installed-globally'
import { debug } from '../debug'
import { getPackageManagerChoice } from './packageManagerChoice'

const cliPkgName = '@sanity/cli'

interface Options {
  cwd?: string
  workDir?: string
}

export async function getCliUpgradeCommand(options: Options = {}): Promise<string> {
  let { cwd, workDir } = options
  cwd = path.resolve(cwd || process.cwd())
  workDir = path.resolve(workDir || cwd)

  if (isInstalledGlobally && isInstalledUsingYarn()) {
    debug('CLI is installed globally with yarn')
    return `yarn global add ${cliPkgName}`
  }

  if (isInstalledGlobally) {
    debug('CLI is installed globally with npm')
    return `npm install -g ${cliPkgName}`
  }

  const cmds = cwd === workDir ? [] : [`cd ${path.relative(cwd, workDir)}`]

  const { chosen } = await getPackageManagerChoice(workDir, { interactive: false })

  if (chosen === 'yarn') {
    cmds.push(`yarn up ${cliPkgName}`)
  } else if (chosen === 'pnpm') {
    cmds.push(`pnpm update ${cliPkgName}`)
  } else {
    cmds.push(`npm update ${cliPkgName}`)
  }

  return cmds.join(' && ')
}

function isInstalledUsingYarn() {
  const isWindows = process.platform === 'win32'
  const yarnPath = isWindows
    ? path.join('Yarn', 'config', 'global')
    : path.join('.config', 'yarn', 'global')

  return __dirname.includes(yarnPath)
}
