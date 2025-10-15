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
    // inherit stdin & stdout, pipe stderr
    stdio: ['inherit', 'inherit', 'pipe'],
  }

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
    try {
      await execa(cmd, args, execOptions)
      progress.succeed()
    } catch (err) {
      progress.fail()
      throw new Error('Dependency installation failed', {cause: err})
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
    // inherit stdin & stdout, pipe stderr
    stdio: ['inherit', 'inherit', 'pipe'],
  }

  const npmArgs = ['install', '--legacy-peer-deps', '--save', ...packages]
  let install: Promise<ExecaReturnValue<string>> | undefined
  if (packageManager === 'npm') {
    output.print(`Running 'npm ${npmArgs.join(' ')}'`)
    install = execa('npm', npmArgs, execOptions)
  } else if (packageManager === 'yarn') {
    const yarnArgs = ['add', ...packages]
    output.print(`Running 'yarn ${yarnArgs.join(' ')}'`)
    install = execa('yarn', yarnArgs, execOptions)
  } else if (packageManager === 'pnpm') {
    const pnpmArgs = ['add', '--save-prod', ...packages]
    output.print(`Running 'pnpm ${pnpmArgs.join(' ')}'`)
    install = execa('pnpm', pnpmArgs, execOptions)
  } else if (packageManager === 'bun') {
    const bunArgs = ['add', ...packages]
    output.print(`Running 'bun ${bunArgs.join(' ')}'`)
    install = execa('bun', bunArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(`Manual installation selected - run 'npm ${npmArgs.join(' ')}' or equivalent`)
  }
  try {
    await install
  } catch (error) {
    throw new Error('Package installation failed', {cause: error})
  }
}
