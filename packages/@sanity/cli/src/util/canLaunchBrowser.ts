import os from 'node:os'

export function canLaunchBrowser(): boolean {
  const isWindowsOrMac = ['win32', 'darwin'].includes(os.platform())
  if (isWindowsOrMac) {
    return true
  }

  const hasWM = Boolean(process.env.XDG_CURRENT_DESKTOP || process.env.GDMSESSION)
  return hasWM
}
