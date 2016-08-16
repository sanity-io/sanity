/* eslint-disable no-console */
import ora from 'ora'
import chalk from 'chalk'

export default {
  print(...args) {
    console.log(...args)
  },

  error(...args) {
    if (args[0] instanceof Error) {
      console.error(chalk.red(args[0].stack))
    } else {
      console.error(...args)
    }
  },

  spinner(...args) {
    return ora(...args)
  }
}
