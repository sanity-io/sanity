/* eslint-disable no-console */
import chalk from 'chalk'
import ora, {type Options, type Ora} from 'ora'

const SYMBOL_CHECK = chalk.green('✓')
const SYMBOL_WARN = chalk.yellow('⚠')
const SYMBOL_FAIL = chalk.red('✗')

let isFirstClear = true

export default {
  print(...args: unknown[]): void {
    console.log(...args)
  },

  success(firstPartOfMessage: unknown, ...args: unknown[]): void {
    console.log(`${SYMBOL_CHECK} ${firstPartOfMessage}`, ...args)
  },

  warn(firstPartOfMessage: unknown, ...args: unknown[]): void {
    console.warn(`${SYMBOL_WARN} ${firstPartOfMessage}`, ...args)
  },

  error(firstPartOfMessage: unknown, ...args: unknown[]): void {
    if (firstPartOfMessage instanceof Error) {
      console.error(`${SYMBOL_FAIL} ${chalk.red(firstPartOfMessage.stack)}`)
    } else {
      console.error(`${SYMBOL_FAIL} ${firstPartOfMessage}`, ...args)
    }
  },

  clear: (): void => {
    // On first run, clear completely so it doesn't show half screen on Windows.
    // On next runs, use a different sequence that properly scrolls back.
    process.stdout.write(isFirstClear ? '\x1bc' : '\x1b[2J\x1b[0f')
    isFirstClear = false
  },

  spinner(options: Options): Ora {
    const spinner = ora(options)
    // Override the default status methods to use custom symbols instead of emojis
    spinner.succeed = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_CHECK})
    spinner.warn = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_WARN})
    spinner.fail = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_FAIL})
    return spinner
  },
}
