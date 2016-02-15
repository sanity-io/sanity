import childProc from 'child_process'
import thenify from 'thenify'
import path from 'path'

const npmPath = path.resolve(path.join(__dirname, '..', '..', 'node_modules', '.bin', 'npm'))
const exec = thenify(childProc.execFile)

export function execute(args) {
  return exec(npmPath, args)
}
