import childProc from 'child_process'
import thenify from 'thenify'

const exec = thenify(childProc.exec)

export default function getGlobalVersion(opts) {
  return exec('sanity --version', opts || {})
    .then(version => version[0].trim())
    .catch(() => null)
}
