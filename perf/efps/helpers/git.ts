import {execSync} from 'node:child_process'

export function getCurrentGitBranchSync(): string | null {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch (error: unknown) {
    console.error('Error getting Git branch:', (error as Error).message)
    return null
  }
}

export function getCurrentGitCommitSync(): string | null {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch (error: unknown) {
    console.error('Error getting Git commit:', (error as Error).message)
    return null
  }
}
