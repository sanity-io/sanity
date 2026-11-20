import {SHORTLIST_SIZE} from '../config'
import {type CliDeps} from './deps'

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export type OutputValidator = (value: string) => boolean

export function matchesSemver(value: string): boolean {
  return SEMVER_PATTERN.test(value)
}

export function matchesSemverOrEmpty(value: string): boolean {
  return value === '' || SEMVER_PATTERN.test(value)
}

export function matchesSlotCount(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) <= SHORTLIST_SIZE
}

export function matchesOneOf(allowed: readonly string[]): OutputValidator {
  return (value) => allowed.includes(value)
}

export interface OutputEntry {
  name: string
  value: string
  isValid: OutputValidator
}

export function toOutputLines(entries: OutputEntry[]): string[] {
  return entries.map((entry) => {
    if (entry.isValid(entry.value)) return `${entry.name}=${entry.value}`
    throw new Error(`Refusing to write GITHUB_OUTPUT ${entry.name}: value failed validation`)
  })
}

export async function appendGithubOutput(deps: CliDeps, entries: OutputEntry[]): Promise<void> {
  const lines = toOutputLines(entries)
  const outputPath = deps.env.GITHUB_OUTPUT
  if (outputPath) await deps.files.appendText(outputPath, `${lines.join('\n')}\n`)
}
