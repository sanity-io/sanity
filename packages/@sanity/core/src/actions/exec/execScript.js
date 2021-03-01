const spawn = require('child_process').spawn
const path = require('path')
const fse = require('fs-extra')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')

function parseCliFlags(args) {
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

module.exports = async function execScript(args, context) {
  // Reparsing CLI flags for better control of binary flags
  const {withUserToken, mockBrowserEnv, script} = parseCliFlags(args)
  const {workDir} = context

  const scriptPath = path.resolve(script || '')
  if (!script) {
    throw new Error('SCRIPT must be provided. `sanity exec <script>`')
  }

  if (!(await fse.exists(scriptPath))) {
    throw new Error(`${scriptPath} does not exist`)
  }

  const babel = require.resolve('./babel')
  const loader = require.resolve('./pluginLoader')
  const requireContextPath = require.resolve('./requireContext')
  const browserEnvPath = require.resolve('./registerBrowserEnv')
  const configClientPath = require.resolve('./configClient')
  const baseArgs = mockBrowserEnv
    ? ['-r', browserEnvPath]
    : ['-r', babel, '-r', loader, '-r', requireContextPath]

  const nodeArgs = baseArgs
    .concat(withUserToken ? ['-r', configClientPath] : [])
    .concat(scriptPath)
    .concat(args.extraArguments || [])

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
