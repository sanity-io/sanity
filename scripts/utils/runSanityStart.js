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

const COMPILE_START = /webpack building/
const COMPILE_DONE = /webpack built/
exports.runSanityStart = function runSanityStart(projectPath, port) {
  const proc = childProcess.spawn('sanity', ['start', '--host', '0.0.0.0', '--port', port], {
    shell: isWindows,
    cwd: projectPath,
    env: getProjectEnv(projectPath),
  })

  return mergeStream([
    proc.stdout.pipe(
      through((data, enc, cb) => {
        const stdout = data.toString().trim()
        if (COMPILE_START.test(stdout)) {
          // this message causes screen to be cleared and we don't want that since it sometimes
          // hides errors
          cb(null, 'webpack building…')
          return
        }
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
