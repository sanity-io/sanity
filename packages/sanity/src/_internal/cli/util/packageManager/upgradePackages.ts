import execa, {type CommonOptions, type ExecaReturnValue} from 'execa'

import {getPartialEnvWithNpmPath, type PackageManager} from './packageManagerChoice'

export interface InstallOptions {
  packageManager: PackageManager
  packages: [name: string, version: string][]
}

export async function upgradePackages(
  options: InstallOptions,
  context: {output: {print: (output: string) => void}; workDir: string},
): Promise<void> {
  const {packageManager, packages} = options
  const {output, workDir} = context
  const execOptions: CommonOptions<'utf8'> = {
    encoding: 'utf8',
    env: getPartialEnvWithNpmPath(workDir),
    cwd: workDir,
    stdio: 'inherit',
  }
  const upgradePackageArgs = packages.map((pkg) => pkg.join('@'))
  let result: ExecaReturnValue<string> | undefined
  if (packageManager === 'npm') {
    const npmArgs = ['install', '--legacy-peer-deps', ...upgradePackageArgs]
    output.print(`Running 'npm ${npmArgs.join(' ')}'`)
    result = await execa('npm', npmArgs, execOptions)
  } else if (packageManager === 'yarn') {
    const yarnArgs = ['upgrade ', ...upgradePackageArgs]
    output.print(`Running 'yarn ${yarnArgs.join(' ')}'`)
    result = await execa('yarn', yarnArgs, execOptions)
  } else if (packageManager === 'pnpm') {
    const pnpmArgs = ['upgrade', ...upgradePackageArgs]
    output.print(`Running 'pnpm ${pnpmArgs.join(' ')}'`)
    result = await execa('pnpm', pnpmArgs, execOptions)
  } else if (packageManager === 'bun') {
    const bunArgs = ['update', ...upgradePackageArgs]
    output.print(`Running 'bun ${bunArgs.join(' ')}'`)
    result = await execa('bun', bunArgs, execOptions)
  } else if (packageManager === 'manual') {
    output.print(
      `Manual installation selected - run 'npm upgrade ${upgradePackageArgs.join(' ')}' or equivalent`,
    )
  }

  if (result?.exitCode || result?.failed) {
    throw new Error('Package upgrade failed')
  }
}
