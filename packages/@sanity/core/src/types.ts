/**
 * Note: These typings actually belong in CLI, but for now we only use TS in
 * _parts_ of `@sanity/core` and in none of `@sanity/cli`. At some point we'll
 * probably want to rewrite the CLI, with typescript and a more plain sucommand
 * approach - but until then this serves as a partial typing helper
 */
import type {ChildProcessWithoutNullStreams} from 'child_process'
import type {SanityClient} from '@sanity/client'
import type {prompt, Separator, DistinctQuestion} from 'inquirer'

export interface CliCommandContext {
  output: CliOutputter
  prompt: CliPrompter
  apiClient: CliApiClient
  yarn: CliBundledYarn
  cliRoot: string
  workDir: string
  corePath: string

  // @todo add chalk typings (it's a direct assignment of chalk@^2.4.2)
  // chalk: Chalk
}

export interface CliOutputter {
  print: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  clear: () => void

  // @todo upgrade ora to >=5.0.0 and provide correct typings
  spinner(...args: any[]): any
}

export type CliPrompter = typeof prompt & {
  Separator: typeof Separator
  single: <T = string>(question: Omit<DistinctQuestion, 'name'> & {choices: string[]}) => Promise<T>
}

export type CliApiClient = (options: {
  requireUser?: boolean
  requireProject?: boolean
}) => SanityClient

export interface CliYarnOptions {
  print?: CliOutputter['print']
  error?: CliOutputter['error']
  rootDir?: string
}

export type CliBundledYarn = (
  args: string[],
  options?: CliYarnOptions
) => Promise<ChildProcessWithoutNullStreams>
