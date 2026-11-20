import {parseArgs} from 'node:util'

import {SHORTLIST_SIZE} from '../config'
import {errorMessage} from '../sourced'
import {type GuardReason, type PromotionOutcome} from '../types'
import {UsageError} from './deps'
import {matchesSemver} from './outputs'

export const MIN_AS_OF = '2025-01-01T00:00:00Z'
export const GUARD_REASONS: readonly GuardReason[] = [
  'multiple-slots-approved',
  'slot-not-approved',
  'stable-moved',
  'not-eligible',
  'data-unavailable',
]
const HTTP_PROTOCOLS = new Set(['https:', 'http:'])
const PROMOTION_OUTCOMES: readonly PromotionOutcome[] = ['promoted', 'guard-failed', 'tag-failed']

type OptionSpec = Record<string, {type: 'string' | 'boolean'}>

const STRING = {type: 'string'} as const
const BOOLEAN = {type: 'boolean'} as const

export const COMMAND_OPTIONS = {
  'collect': {'as-of': STRING, 'out': STRING, 'history': STRING},
  'recommend': {'out-dir': STRING, 'run-url': STRING, 'no-llm': BOOLEAN},
  'slack-route': {},
  'verify': {
    'version': STRING,
    'slot': STRING,
    'expected-stable': STRING,
    'run-id': STRING,
    'history': STRING,
  },
  'result': {
    'slot': STRING,
    'slot-count': STRING,
    'version': STRING,
    'previous': STRING,
    'outcome': STRING,
    'guard-reason': STRING,
    'run-id': STRING,
    'run-url': STRING,
    'out-dir': STRING,
  },
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

export function parseVersion(value: string, name: string): string {
  if (matchesSemver(value)) return value
  throw new UsageError(`--${name} must be a plain semver version (X.Y.Z), got "${value}"`)
}

export function parseSlot(value: string, name: string, maximum: number = SHORTLIST_SIZE): number {
  const slot = Number(value)
  if (Number.isInteger(slot) && slot >= 1 && slot <= maximum) return slot
  throw new UsageError(`--${name} must be an integer from 1 to ${maximum}, got "${value}"`)
}

export function parseCount(value: string, name: string): number {
  const count = Number(value)
  if (Number.isInteger(count) && count >= 0 && count <= SHORTLIST_SIZE) return count
  throw new UsageError(`--${name} must be an integer from 0 to ${SHORTLIST_SIZE}, got "${value}"`)
}

export function parseOutcome(value: string): PromotionOutcome {
  const outcome = PROMOTION_OUTCOMES.find((candidate) => candidate === value)
  if (outcome) return outcome
  throw new UsageError(`--outcome must be one of ${PROMOTION_OUTCOMES.join(', ')}, got "${value}"`)
}

export function parseGuardReason(value: string): GuardReason {
  const reason = GUARD_REASONS.find((candidate) => candidate === value)
  if (reason) return reason
  throw new UsageError(`--guard-reason must be one of ${GUARD_REASONS.join(', ')}, got "${value}"`)
}

export function parseRunId(value: string): string {
  if (/^\d+$/.test(value)) return value
  throw new UsageError(`--run-id must be numeric, got "${value}"`)
}

export function parseRunUrl(value: string): string {
  if (URL.canParse(value) && HTTP_PROTOCOLS.has(new URL(value).protocol)) return value
  throw new UsageError(`--run-url must be an http(s) URL, got "${value}"`)
}

export function parseInstant(value: string, name: string): string {
  const time = Date.parse(value)
  if (Number.isNaN(time)) throw new UsageError(`--${name} is not a valid date-time: "${value}"`)
  return new Date(time).toISOString().replace('.000Z', 'Z')
}

export function parseAsOf(value: string, now: Date): string {
  const instant = parseInstant(value, 'as-of')
  const time = Date.parse(instant)
  if (time > now.getTime()) throw new UsageError(`--as-of must not be in the future: "${value}"`)
  if (time < Date.parse(MIN_AS_OF)) throw new UsageError(`--as-of must be on or after ${MIN_AS_OF}`)
  return instant
}
