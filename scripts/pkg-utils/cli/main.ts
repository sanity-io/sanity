import {isString} from '../helpers'
import {bundleCommand} from './commands/bundleCommand'
import {exportsCheckCommand} from './commands/exportsCheckCommand'
import {exportsCleanCommand} from './commands/exportsCleanCommand'
import {exportsGenerateCommand} from './commands/exportsGenerateCommand'
import {transpileCommand} from './commands/transpileCommand'
import {getCLIContext} from './helpers'

async function main() {
  const {cmd, cwd: currentCwd, flags} = await getCLIContext()
  const cwd = isString(flags.cwd) ? flags.cwd : currentCwd

  if (!cmd) {
    throw new Error('pkg-utils: missing command')
  }

  if (cmd === 'bundle') {
    await bundleCommand({
      cwd,
      target: (isString(flags.target) ? flags.target : 'web') as any,
      tsconfig: isString(flags.tsconfig) ? flags.tsconfig : undefined,
      watch: Boolean(flags.watch),
    })
    return
  }

  if (cmd === 'exports-check') {
    await exportsCheckCommand({
      cwd,
      target: (isString(flags.target) ? flags.target : 'web') as any,
    })
    return
  }

  if (cmd === 'exports-clean') {
    await exportsCleanCommand({
      cwd,
    })
    return
  }

  if (cmd === 'exports-generate') {
    await exportsGenerateCommand({
      cwd,
    })
    return
  }

  if (cmd === 'transpile') {
    await transpileCommand({
      cwd,
      target: (isString(flags.target) ? flags.target : 'web') as any,
      tsconfig: isString(flags.tsconfig) ? flags.tsconfig : undefined,
      watch: Boolean(flags.watch),
    })
    return
  }

  throw new Error(`pkg-utils: unknown command: "${cmd}"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
