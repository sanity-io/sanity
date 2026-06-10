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

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {url: null, dryRun: false, verbose: false, help: false}

  if (argv.includes('--help') || argv.includes('-h')) {
    return {...args, help: true}
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--verbose' || arg === '-v') args.verbose = true
    else if (arg.startsWith('-'))
      throw new Error(`Unknown flag: ${arg}. Run with --help for usage.`)
    else {
      if (args.url) throw new Error(`Unexpected extra argument: ${arg}`)
      args.url = arg
    }
  }

  return args
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
