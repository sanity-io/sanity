import execa, {type CommonOptions, type ExecaReturnValue} from 'execa'

import {type CliCommandContext} from '../types'
import {getPartialEnvWithNpmPath, type PackageManager} from './packageManagerChoice'

export interface InstallOptions {
  packageManager: PackageManager
  packages: string[]
}

export async function installDeclaredPackages(
  cwd: string,
  packageManager: PackageManager,
  context: Pick<CliCommandContext, 'output'>,
): Promise<void> {
  const {output} = context
  const execOptions: CommonOptions<'utf8'> = {
    encoding: 'utf8',
    env: getPartialEnvWithNpmPath(cwd),
    cwd,
    stdio: 'pipe',
  }

  // results of running execa with the selected package manager
  let result: ExecaReturnValue<string> | undefined

  type PackageManagerLibs = Exclude<PackageManager, 'manual'>
  type InstallerArgs = {[key in PackageManagerLibs]: string[]}

  const installerArgs: InstallerArgs = {
    npm: ['install', '--legacy-peer-deps'],
    yarn: ['install'],
    pnpm: ['install'],
    bun: ['install'],
  }

  async function handleInstall(cmd: PackageManager, args: InstallerArgs[PackageManagerLibs]) {
    // Start a spinner for the install process
    const progress = output.spinner(`Running ${cmd} ${args.join(' ')}\n`).start()

    // Perform the install command with execa
    result = await execa(cmd, args, execOptions)

    // If the install fails, log execa's stdout and throw…
    if (result?.exitCode || result?.failed) {
      progress.fail()
      output.print(result.stdout)
      throw new Error('Dependency installation failed')
    } else {
      // …otherwise, just mark the install as successful
      progress.succeed()
    }
  }

  if (packageManager === 'manual') {
    output.print(`Manual installation selected — run 'npm ${installerArgs.npm} or equivalent'`)
  } else {
    await handleInstall(packageManager, installerArgs[packageManager])
  }
}

export async function installNewPackages(
  options: InstallOptions,
  context: Pick<CliCommandContext, 'output' | 'workDir'>,
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
  } else if (packageManager === 'bun') {
    const bunArgs = ['add', ...packages]
    output.print(`Running 'bun ${bunArgs.join(' ')}'`)
    result = await execa('bun', bunArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(`Manual installation selected - run 'npm ${npmArgs.join(' ')}' or equivalent`)
  }

  if (result?.exitCode || result?.failed) {
    throw new Error('Package installation failed')
  }
}
