import {type CliDeps} from './deps'

export type OutputValidator = (value: string) => boolean

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
