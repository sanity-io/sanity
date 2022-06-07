import {spawn} from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import type {CliCommandAction, CliCommandArguments} from '@sanity/cli'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

interface ExecFlags {
  'with-user-token'?: boolean
  'mock-browser-env'?: boolean
}

function parseCliFlags(args: CliCommandArguments<ExecFlags>) {
  return yargs(hideBin(args.argv || process.argv)).command(
    'exec [script]',
    'executes given script',
    (cmd) =>
      cmd
        .positional('script', {type: 'string', demandOption: true})
        .option('with-user-token', {type: 'boolean', default: false})
        .option('mock-browser-env', {type: 'boolean', default: false})
  ).argv
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

  const esbuildPath = path.resolve(__dirname, './esbuild.js')
  const browserEnvPath = path.resolve(__dirname, './registerBrowserEnv.js')
  const configClientPath = path.resolve(__dirname, './configClient.js')
  const baseArgs = mockBrowserEnv ? ['-r', browserEnvPath] : ['-r', esbuildPath]
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
