import fs from 'fs'
import util from 'util'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

export interface CLIContext {
  args: (string | number)[]
  cmd?: string | number
  cwd: string
  flags: Record<string, unknown>
}

const YARGS_IGNORE_KEY = ['_', '$0']

export const readFile = util.promisify(fs.readFile)
export const writeFile = util.promisify(fs.writeFile)

export async function readJSONFile(filePath: string): Promise<Record<string, any>> {
  const buf = await readFile(filePath)

  return JSON.parse(buf.toString())
}

export async function getCLIContext(): Promise<CLIContext> {
  const argv = await yargs(hideBin(process.argv)).argv
  const args = argv._.slice(0)
  const cmd = args.shift()
  const flags = Object.entries(argv).reduce((acc: Record<string, unknown>, [key, value]) => {
    if (!YARGS_IGNORE_KEY.includes(key)) {
      acc[key] = value
    }

    return acc
  }, {})

  return {args, cmd, cwd: process.cwd(), flags}
}
