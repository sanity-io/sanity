const os = require('os')

module.exports = () => {
  const isWindowsOrMac = ['win32', 'darwin'].includes(os.platform())
  if (isWindowsOrMac) {
    return true
  }

  // eslint-disable-next-line no-process-env
  const hasWM = Boolean(process.env.XDG_CURRENT_DESKTOP || process.env.GDMSESSION)
  return hasWM
}
