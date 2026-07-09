import {object} from '@optique/core/constructs'
import {formatMessage} from '@optique/core/message'
import {optional} from '@optique/core/modifiers'
import {parseSync} from '@optique/core/parser'
import {argument, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

export interface CliArgs {
  url: string | null
  dryRun: boolean
  verbose: boolean
  help: boolean
}

export interface CliResult {
  stdout: string[]
  stderr: string[]
  exitCode: number
}

const isTTY = process.stdout.isTTY
const color = (code: string, value: string): string =>
  isTTY ? `\x1b[${code}m${value}\x1b[0m` : value

const parser = object({
  dryRun: option('--dry-run'),
  verbose: option('-v', '--verbose'),
  url: optional(argument(string({metavar: 'URL'}))),
})

export function parseArgs(argv: string[]): CliArgs {
  // --help anywhere wins, so callers can render their own help text even when
  // the rest of the invocation wouldn't parse
  if (argv.includes('--help') || argv.includes('-h')) {
    return {url: null, dryRun: false, verbose: false, help: true}
  }

  const result = parseSync(parser, argv)
  if (!result.success) {
    throw new Error(`${formatMessage(result.error)} Run with --help for usage.`)
  }

  const {url, dryRun, verbose} = result.value
  return {url: url ?? null, dryRun, verbose, help: false}
}

export function createLog(args: CliArgs, stderr: string[]): (msg: string) => void {
  return (msg: string): void => {
    if (args.verbose) stderr.push(`[debug] ${msg}\n`)
  }
}

export function writeResult(result: CliResult): void {
  for (const chunk of result.stdout) process.stdout.write(chunk)
  for (const chunk of result.stderr) process.stderr.write(chunk)
}

export function die(msg: string): never {
  process.stderr.write(color('31', `error: ${msg}\n`))
  process.exit(1)
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
