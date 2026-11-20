import {loadHistoryFixture} from '../__fixtures__/load'
import {type Approval} from '../types'
import {type CliDeps} from './deps'

export const HISTORY_PATH = '/fixtures/history.json'
export const FAKE_NOW = '2026-11-20T13:00:00Z'

export interface FakeCli {
  deps: CliDeps
  files: Map<string, string>
  stdout: string[]
  stderr: string[]
}

export interface FakeCliOptions {
  env?: Record<string, string | undefined>
  approvals?: Approval[] | Error
}

export function createFakeCli(options: FakeCliOptions = {}): FakeCli {
  const files = new Map<string, string>([[HISTORY_PATH, JSON.stringify(loadHistoryFixture())]])
  const stdout: string[] = []
  const stderr: string[] = []
  const deps: CliDeps = {
    env: options.env ?? {},
    now: () => new Date(FAKE_NOW),
    files: {
      readText: async (path) => {
        const content = files.get(path)
        if (content === undefined) throw new Error(`ENOENT: ${path}`)
        return content
      },
      writeText: async (path, content) => {
        files.set(path, content)
      },
      appendText: async (path, content) => {
        files.set(path, (files.get(path) ?? '') + content)
      },
    },
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
    loadHistory: async () => loadHistoryFixture(),
    fetchApprovals: async () => {
      if (options.approvals instanceof Error) throw options.approvals
      return options.approvals ?? []
    },
    createModelClient: () => {
      throw new Error('model client must not be created in these tests')
    },
  }
  return {deps, files, stdout, stderr}
}

export function readFile(fake: FakeCli, path: string): string {
  const content = fake.files.get(path)
  if (content === undefined) throw new Error(`missing file ${path}`)
  return content
}
