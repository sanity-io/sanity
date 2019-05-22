const spawn = require('child_process').spawn
const path = require('path')
const fse = require('fs-extra')

module.exports = async args => {
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
  const nodeArgs = ['-r', babel, '-r', loader]
    .concat(withToken ? ['-r', require.resolve('./configClient')] : [])
    .concat(scriptPath)
    .concat(args.extraArguments || [])

  const proc = spawn(process.argv[0], nodeArgs, {stdio: 'inherit'})
  proc.on('close', process.exit)
}
