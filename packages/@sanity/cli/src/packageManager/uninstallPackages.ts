import execa, {CommonOptions, ExecaReturnValue} from 'execa'
import type {CliCommandContext} from '../types'
import {getPartialEnvWithNpmPath, PackageManager} from './packageManagerChoice'

export interface UninstallOptions {
  packageManager: PackageManager
  packages: string[]
}

export async function uninstallPackages(
  options: UninstallOptions,
  context: Pick<CliCommandContext, 'output' | 'workDir'>
): Promise<void> {
  const {packageManager, packages} = options
  const {output, workDir} = context
  const execOptions: CommonOptions<'utf8'> = {
    encoding: 'utf8',
    env: getPartialEnvWithNpmPath(workDir),
    cwd: workDir,
    stdio: 'inherit',
  }

  const npmArgs = ['uninstall', ...packages]
  let result: ExecaReturnValue<string> | undefined
  if (packageManager === 'npm') {
    output.print(`Running 'npm ${npmArgs.join(' ')}'`)
    result = await execa('npm', npmArgs, execOptions)
  } else if (packageManager === 'yarn') {
    const yarnArgs = ['remove', ...packages]
    output.print(`Running 'yarn ${yarnArgs.join(' ')}'`)
    result = await execa('yarn', yarnArgs, execOptions)
  } else if (packageManager === 'pnpm') {
    const pnpmArgs = ['remove', ...packages]
    output.print(`Running 'pnpm ${pnpmArgs.join(' ')}'`)
    result = await execa('pnpm', pnpmArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(`Manual installation selected - run 'npm ${npmArgs.join(' ')}' or equivalent`)
  }

  if (result?.exitCode || result?.failed) {
    throw new Error('Package installation failed')
  }
}
