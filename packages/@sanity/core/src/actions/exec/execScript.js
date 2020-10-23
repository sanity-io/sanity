const spawn = require('child_process').spawn
const path = require('path')
const dotenv = require('dotenv')
const fse = require('fs-extra')

// Try to load .env files from the current directory
// eslint-disable-next-line no-process-env
const env = process.env.SANITY_ACTIVE_ENV || process.env.NODE_ENV || 'development'
dotenv.config({path: path.join(process.cwd(), `.env.${env}`)})

module.exports = async (args) => {
  // In case of specifying --with-user-token <file.js>, use the "token" as the script
  const script = args.argsWithoutOptions[0] || args.extOptions['with-user-token']
  const withToken = Boolean(args.extOptions['with-user-token'])
  const scriptPath = path.resolve(script)

  if (!script) {
    throw new Error('SCRIPT must be provided. `sanity exec <script>`')
  }

  if (!(await fse.exists(scriptPath))) {
    throw new Error(`${scriptPath} does not exist`)
  }

  const babel = require.resolve('./babel')
  const loader = require.resolve('./pluginLoader')
  const requireContext = require.resolve('./requireContext')
  const nodeArgs = ['-r', babel, '-r', loader, '-r', requireContext]
    .concat(withToken ? ['-r', require.resolve('./configClient')] : [])
    .concat(scriptPath)
    .concat(args.extraArguments || [])

  const proc = spawn(process.argv[0], nodeArgs, {stdio: 'inherit'})
  proc.on('close', process.exit)
}
