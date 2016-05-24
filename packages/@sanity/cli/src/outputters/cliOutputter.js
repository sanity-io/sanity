/* eslint-disable no-console */
import ora from 'ora'
import colors from 'colors/safe'

export default {
  print(...args) {
    console.log(...args)
  },

  error(...args) {
    if (args[0] instanceof Error) {
      console.error(colors.red(args[0].stack))
    } else {
      console.error(...args)
    }
  },

  spinner(...args) {
    return ora(...args)
  }
}
