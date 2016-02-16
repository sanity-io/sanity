/* eslint-disable no-process-env */
import childProc from 'child-process-promise'
import path from 'path'

const npmPath = path.resolve(path.join(__dirname, '..', '..', 'node_modules', '.bin', 'npm'))
const npmEnv = {env: Object.assign({}, process.env, {
  NPM_CONFIG_LOGLEVEL: 'silent',
  NPM_CONFIG_PARSEABLE: true
})}

export function execute(args, opts) {
  return childProc.execFile(npmPath, args, opts || npmEnv)
}
