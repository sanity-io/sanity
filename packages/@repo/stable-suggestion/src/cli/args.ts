import {parseArgs} from 'node:util'

import {errorMessage} from '../sourced'
import {formatInstant} from '../time'
import {UsageError} from './deps'

const MIN_AS_OF = '2025-01-01T00:00:00Z'
const HTTP_PROTOCOLS = new Set(['https:', 'http:'])

type OptionSpec = Record<string, {type: 'string' | 'boolean'}>

const STRING = {type: 'string'} as const
const BOOLEAN = {type: 'boolean'} as const

const COMMAND_OPTIONS = {
  'collect': {'as-of': STRING, 'out': STRING, 'history': STRING},
  'recommend': {
    'out-dir': STRING,
    'run-url': STRING,
    'workflow-url': STRING,
    'no-llm': BOOLEAN,
  },
  'slack-route': {},
  'backtest': {
    'from': STRING,
    'to': STRING,
    'out': STRING,
    'json': STRING,
    'llm-sample': STRING,
    'max-llm-calls': STRING,
    'history': STRING,
  },
} satisfies Record<string, OptionSpec>

export type CommandName = keyof typeof COMMAND_OPTIONS

export function isCommandName(value: string | undefined): value is CommandName {
  return value !== undefined && Object.hasOwn(COMMAND_OPTIONS, value)
}

export interface ParsedArguments {
  values: Record<string, string | boolean | undefined>
  positionals: string[]
}

export function parseCommandArguments(command: CommandName, argv: string[]): ParsedArguments {
  try {
    const {values, positionals} = parseArgs({
      args: argv,
      options: COMMAND_OPTIONS[command] as OptionSpec,
      allowPositionals: command === 'recommend',
      strict: true,
    })
    return {values, positionals}
  } catch (error) {
    throw new UsageError(errorMessage(error))
  }
}

export function optionalString(values: ParsedArguments['values'], name: string): string | null {
  const value = values[name]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function requireString(values: ParsedArguments['values'], name: string): string {
  const value = optionalString(values, name)
  if (value !== null) return value
  throw new UsageError(`Missing required option --${name}`)
}

export function parseHttpUrl(value: string, name: string): string {
  if (URL.canParse(value) && HTTP_PROTOCOLS.has(new URL(value).protocol)) return value
  throw new UsageError(`--${name} must be an http(s) URL, got "${value}"`)
}

export function parseInstant(value: string, name: string): string {
  const time = Date.parse(value)
  if (Number.isNaN(time)) throw new UsageError(`--${name} is not a valid date-time: "${value}"`)
  return formatInstant(time)
}

export function parseAsOf(value: string, now: Date): string {
  const instant = parseInstant(value, 'as-of')
  const time = Date.parse(instant)
  if (time > now.getTime()) throw new UsageError(`--as-of must not be in the future: "${value}"`)
  if (time < Date.parse(MIN_AS_OF)) throw new UsageError(`--as-of must be on or after ${MIN_AS_OF}`)
  return instant
}
