import {type ModelClient} from '../model'
import {DAY_MS} from '../time'
import {type Approval, type History} from '../types'

export class UsageError extends Error {
  override name = 'UsageError'
}

export interface CliFiles {
  readText(path: string): Promise<string>
  writeText(path: string, content: string): Promise<void>
  appendText(path: string, content: string): Promise<void>
}

export interface CliDeps {
  env: Record<string, string | undefined>
  now(): Date
  files: CliFiles
  stdout(line: string): void
  stderr(line: string): void
  loadHistory(options: {issuesFrom: Date}): Promise<History>
  fetchApprovals(runId: string): Promise<Approval[]>
  createModelClient(): ModelClient
}

export function daysBefore(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS)
}

export async function writeJson(deps: CliDeps, path: string, value: unknown): Promise<void> {
  await deps.files.writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

export async function readJson<Shape>(deps: CliDeps, path: string): Promise<Shape> {
  return JSON.parse(await deps.files.readText(path)) as Shape
}
