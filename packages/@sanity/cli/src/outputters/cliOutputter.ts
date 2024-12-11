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

  success(...args: unknown[]): void {
    console.log(`${SYMBOL_CHECK} ${args.join(' ')}`)
  },

  warn(...args: unknown[]): void {
    console.warn(`${SYMBOL_WARN} ${args.join(' ')}`)
  },

  error(...args: unknown[]): void {
    if (args[0] instanceof Error) {
      console.error(chalk.red(args[0].stack))
    } else {
      console.error(`${SYMBOL_FAIL} ${args.join(' ')}`)
    }
  },

  clear: (): void => {
    // On first run, clear completely so it doesn't show half screen on Windows.
    // On next runs, use a different sequence that properly scrolls back.
    process.stdout.write(isFirstClear ? '\x1bc' : '\x1b[2J\x1b[0f')
    isFirstClear = false
  },

  spinner(options: Options): Ora {
    const spinner = ora({...options, spinner: 'dots'})
    // Override the default `succeed` method to use a green checkmark, instead of the default emoji
    spinner.succeed = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_CHECK})
    spinner.warn = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_WARN})
    spinner.fail = (text?: string) => spinner.stopAndPersist({text, symbol: SYMBOL_FAIL})
    return spinner
  },
}
