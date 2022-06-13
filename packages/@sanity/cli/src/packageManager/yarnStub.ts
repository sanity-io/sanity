import type {CliCommandContext, CliYarnOptions} from '../types'
import {installDeclaredPackages, installNewPackages} from './installPackages'
import {getPackageManagerChoice} from './packageManagerChoice'
import {uninstallPackages} from './uninstallPackages'

export function getYarnStub(context: Pick<CliCommandContext, 'output' | 'workDir'>) {
  return async function yarnStub(args: string[], options?: CliYarnOptions): Promise<void> {
    const workDir = options?.rootDir || context.workDir
    const yarnContext = {workDir, output: context.output}
    const {chosen} = await getPackageManagerChoice(workDir, {interactive: false})
    const [command, ...packages] = args
    if (command === 'add') {
      await installNewPackages({packageManager: chosen, packages}, yarnContext)
    } else if (command === 'remove') {
      await uninstallPackages({packageManager: chosen, packages}, yarnContext)
    } else if (command === 'install') {
      await installDeclaredPackages(workDir, chosen, yarnContext)
    } else {
      throw new Error(`Unsupported package manager command "${command}"`)
    }
  }
}
