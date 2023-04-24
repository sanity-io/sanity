import {spawn} from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import type {CliCommandAction, CliCommandArguments, PackageJson} from '@sanity/cli'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import readPkgUp from 'read-pkg-up'

interface ExecFlags {
  'with-user-token'?: boolean
  'mock-browser-env'?: boolean
}

async function parseCliFlags(args: CliCommandArguments<ExecFlags>) {
  const flags = await yargs(hideBin(args.argv || process.argv).slice(2))
    .option('with-user-token', {type: 'boolean', default: false})
    .option('mock-browser-env', {type: 'boolean', default: false}).argv

  return {
    ...flags,
    script: args.argsWithoutOptions[0],
  }
}

const execScript: CliCommandAction<ExecFlags> = async function execScript(args, context) {
  // Reparsing CLI flags for better control of binary flags
  const {withUserToken, mockBrowserEnv, script} = await parseCliFlags(args)
  const {workDir} = context

  const scriptPath = path.resolve(script || '')
  if (!script) {
    throw new Error('SCRIPT must be provided. `sanity exec <script>`')
  }

  if (!(await fs.stat(scriptPath).catch(() => false))) {
    throw new Error(`${scriptPath} does not exist`)
  }

  const sanityPkgPath = (await readPkgUp({cwd: __dirname}))?.path
  if (!sanityPkgPath) {
    throw new Error('Unable to resolve `sanity` module root')
  }

  const sanityDir = path.dirname(sanityPkgPath)
  const threadsDir = path.join(sanityDir, 'lib', '_internal', 'cli', 'threads')
  const esbuildPath = path.join(threadsDir, 'esbuild.js')
  const browserEnvPath = path.join(threadsDir, 'registerBrowserEnv.js')
  const configClientPath = path.join(threadsDir, 'configClient.js')

  if (!(await fs.stat(esbuildPath).catch(() => false))) {
    throw new Error('`sanity` module build error: missing threads')
  }

  const packageJsonPath = path.resolve('./package.json')
  const packageJson = (await import(packageJsonPath)) as PackageJson | undefined
  const isEsm = packageJson?.type === 'module'
  const esmBuildArgs = isEsm ? ['--loader', 'esbuild-register/loader'] : []

  const baseArgs = mockBrowserEnv ? ['-r', browserEnvPath] : ['-r', esbuildPath, ...esmBuildArgs]
  const tokenArgs = withUserToken ? ['-r', configClientPath] : []

  const nodeArgs = [...baseArgs, ...tokenArgs, scriptPath, ...args.extraArguments]

  const proc = spawn(process.argv[0], nodeArgs, {
    stdio: 'inherit',
    env: {
      // eslint-disable-next-line no-process-env
      ...process.env,
      SANITY_BASE_PATH: workDir,
    },
  })
  proc.on('close', process.exit)
}

export default execScript
