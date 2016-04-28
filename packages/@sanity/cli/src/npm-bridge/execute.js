/* eslint-disable no-process-env */
import path from 'path'
import whicher from 'which'
import thenify from 'thenify'
import childProc from 'child-process-promise'

const which = thenify(whicher)

const whichOpts = {
  path: [
    path.join(process.cwd(), 'node_modules', '.bin'),
    process.env.PATH
  ].join(path.delimiter)
}

const npmEnv = {env: Object.assign({}, process.env, {
  NPM_CONFIG_LOGLEVEL: 'silent',
  NPM_CONFIG_PARSEABLE: true
})}

export const execute = (args, opts) =>
  which('npm', whichOpts)
    .then(npmPath => childProc.execFile(npmPath, args, opts || npmEnv))
