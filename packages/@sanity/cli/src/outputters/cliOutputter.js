/* eslint-disable no-console */
import ora from 'ora'
import chalk from 'chalk'

let isFirstClear = true
let activeSpinner = null

const output = {
  holdSpinner(then) {
    if (activeSpinner) {
      activeSpinner.stop()
    }

    then()

    if (activeSpinner) {
      activeSpinner.start()
    }
  },

  print(...args) {
    output.holdSpinner(() => console.log(...args))
  },

  error(...args) {
    output.holdSpinner(() => {
      if (args[0] instanceof Error) {
        console.error(chalk.red(args[0].stack))
      } else {
        console.error(...args)
      }
    })
  },

  clear: () => {
    // On first run, clear completely so it doesn't show half screen on Windows.
    // On next runs, use a different sequence that properly scrolls back.
    process.stdout.write(isFirstClear ? '\x1bc' : '\x1b[2J\x1b[0f')
    isFirstClear = false
  },

  spinner(...args) {
    activeSpinner = spinnerProxy(...args)
    return activeSpinner
  }
}

// So you're wondering why we're doing this?
// We need a way to "hold" the spinner while printing a message, then resuming afterwards.
// Once a spinner has been persisted, calling `start()` on it shouldn't actually restart it
function spinnerProxy(...spinArgs) {
  const spinner = ora(...spinArgs)
  let persisted = false

  const api = {
    start: () => (persisted ? api : spinner.start() && api),
    stop: () => spinner.stop() && api,
    clear: () => () => persist().clear() && api,
    succeed: (...args) => persist().succeed(...args) && api,
    warn: (...args) => persist().warn(...args) && api,
    fail: (...args) => persist().fail(...args) && api,
    stopAndPersist: (...args) => persist().stopAndPersist(...args) && api
  }

  function persist() {
    persisted = true
    return spinner
  }

  return api
}

export default output
