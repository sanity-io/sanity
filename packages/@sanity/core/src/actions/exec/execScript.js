const spawn = require('child_process').spawn
const fse = require('fs-extra')
const path = require('path')

module.exports = async args => {
  const [script] = args.argsWithoutOptions
  const scriptPath = path.resolve(script)

  if (!script) {
    throw new Error('SCRIPT must be provided. `sanity exec <script>`')
  }

  if (!await fse.exists(scriptPath)) {
    throw new Error(`${scriptPath} does not exist`)
  }

  const babel = require.resolve('./babel')
  const loader = require.resolve('@sanity/plugin-loader/register')
  const proc = spawn(process.argv[0], ['-r', babel, '-r', loader, scriptPath])

  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
  proc.on('close', process.exit)
}
