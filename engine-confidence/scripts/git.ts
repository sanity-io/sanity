import {spawnSync} from 'node:child_process'

import {repositoryRoot} from './paths'

export interface GitResult {
  status: number | null
  stdout: string
  stderr: string
}

export function runGit(gitArguments: string[], workingDirectory = repositoryRoot): GitResult {
  const result = spawnSync('git', gitArguments, {
    cwd: workingDirectory,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return {status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? ''}
}

export function dirtyPathsUnder(paths: string[], workingDirectory = repositoryRoot): string[] {
  const result = runGit(['status', '--porcelain', '--', ...paths], workingDirectory)
  return result.stdout.split('\n').filter((line) => line.trim().length > 0)
}
