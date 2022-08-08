import execa, {CommonOptions, ExecaReturnValue} from 'execa'
import type {CliCommandContext} from '../types'
import {getPartialEnvWithNpmPath, PackageManager} from './packageManagerChoice'

export interface InstallOptions {
  packageManager: PackageManager
  packages: string[]
}

export async function installDeclaredPackages(
  cwd: string,
  packageManager: PackageManager,
  context: Pick<CliCommandContext, 'output'>
): Promise<void> {
  const {output} = context
  const execOptions: CommonOptions<'utf8'> = {
    encoding: 'utf8',
    env: getPartialEnvWithNpmPath(cwd),
    cwd,
    stdio: 'inherit',
  }

  const npmArgs = ['install', '--legacy-peer-deps']
  let result: ExecaReturnValue<string> | undefined
  if (packageManager === 'npm') {
    output.print(`Running 'npm ${npmArgs.join(' ')}'`)
    result = await execa('npm', npmArgs, execOptions)
  } else if (packageManager === 'yarn') {
    const yarnArgs = ['install']
    output.print(`Running 'yarn ${yarnArgs.join(' ')}'`)
    result = await execa('yarn', yarnArgs, execOptions)
  } else if (packageManager === 'pnpm') {
    const pnpmArgs = ['install']
    output.print(`Running 'pnpm ${pnpmArgs.join(' ')}'`)
    result = await execa('pnpm', pnpmArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(`Manual installation selected - run 'npm ${npmArgs.join(' ')}' or similar`)
  }

  if (result?.exitCode || result?.failed) {
    throw new Error('Dependency installation failed')
  }
}

export async function installNewPackages(
  options: InstallOptions,
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

  const npmArgs = ['install', '--legacy-peer-deps', '--save', ...packages]
  let result: ExecaReturnValue<string> | undefined
  if (packageManager === 'npm') {
    output.print(`Running 'npm ${npmArgs.join(' ')}'`)
    result = await execa('npm', npmArgs, execOptions)
  } else if (packageManager === 'yarn') {
    const yarnArgs = ['add', ...packages]
    output.print(`Running 'yarn ${yarnArgs.join(' ')}'`)
    result = await execa('yarn', yarnArgs, execOptions)
  } else if (packageManager === 'pnpm') {
    const pnpmArgs = ['add', '--save-prod', ...packages]
    output.print(`Running 'pnpm ${pnpmArgs.join(' ')}'`)
    result = await execa('pnpm', pnpmArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(`Manual installation selected - run 'npm ${npmArgs.join(' ')}' or equivalent`)
  }

  if (result?.exitCode || result?.failed) {
    throw new Error('Package installation failed')
  }
}
