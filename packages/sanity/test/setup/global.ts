/* eslint-disable no-process-env */
import os from 'os'
import {execSync} from 'child_process'

const wantedUnixTZ = 'America/Los_Angeles'
const wantedWindowsTZ = 'Pacific Standard Time'

export default function globalSetup(): void {
  if (os.platform() !== 'win32') {
    process.env.TZ = wantedUnixTZ
    return
  }

  // Windows won't let us use `process.env` in the same way, so we need to set
  // the global windows timezone and restore it on exit. If the process exits
  // prematurely, this might cause the timezone to be incorrect - thus we print
  // the warning about how to restore
  const previousTZ = execSync('tzutil /g').toString()
  execSync(`tzutil /s "${wantedWindowsTZ}"`)
  console.warn(
    `timezone changed, if process is killed, run manually to restore: tzutil /s "${previousTZ}"`,
  )

  process.on('exit', () => {
    execSync(`tzutil /s "${previousTZ}"`)
  })
}
