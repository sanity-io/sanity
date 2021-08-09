const childProcess = require('child_process')
const path = require('path')
const isWindows = /^win/.test(process.platform)
const through = require('through2')
const mergeStream = require('merge-stream')

const getProjectEnv = (projectPath) => {
  const npmPath = path.join(projectPath, 'node_modules', '.bin')
  /* eslint-disable no-process-env */
  const paths = [npmPath].concat(process.env.PATH.split(path.delimiter)).filter(Boolean)
  return Object.assign({}, process.env, {
    PATH: paths.join(path.delimiter),
  })
  /* eslint-enable no-process-env */
}
exports.runTsc = function runTsc(projectPath, watch) {
  const proc = childProcess.spawn(
    'tsc',
    ['-b', '--pretty', '--force', ...(watch ? ['--watch'] : [])],
    {
      shell: isWindows,
      cwd: projectPath,
      env: getProjectEnv(projectPath),
    }
  )

  if (!watch) {
    proc.on('close', (code) => {
      if (code !== 0) {
        throw new Error(`Process exited with code ${code}`)
      }
    })
  }

  return mergeStream([
    proc.stdout.pipe(
      through((data, enc, cb) => {
        const stdout = data.toString().trim()
        cb(null, stdout)
      })
    ),
    proc.stderr.pipe(
      through((data, enc, cb) => {
        cb(new Error(data.toString()))
      })
    ),
  ])
}
