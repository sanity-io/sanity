import {execSync, execFileSync, ExecSyncOptions} from 'child_process'
import path from 'path'
import rimraf from 'rimraf'

const defaultCommitMessage = 'feat: bootstrap sanity studio'

export function tryGitInit(rootDir: string, commitMessage?: string): boolean {
  const execOptions: ExecSyncOptions = {stdio: 'ignore', cwd: rootDir}

  let didInit = false
  try {
    execSync('git --version', execOptions)
    if (isInGitRepository(rootDir) || isInMercurialRepository(rootDir)) {
      return false
    }

    execSync('git init', execOptions)
    didInit = true

    execSync('git checkout -b main', execOptions)

    execSync('git add -A', execOptions)
    execFileSync('git', ['commit', '-m', commitMessage || defaultCommitMessage], {
      stdio: 'ignore',
      cwd: rootDir,
    })
    return true
  } catch (e) {
    if (didInit) {
      try {
        rimraf.sync(path.join(rootDir, '.git'))
      } catch (_) {
        // intentional noop
      }
    }
    return false
  }
}

function isInGitRepository(rootDir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {stdio: 'ignore', cwd: rootDir})
    return true
  } catch (_) {
    // intentional noop
  }
  return false
}

function isInMercurialRepository(rootDir: string): boolean {
  try {
    execSync('hg --cwd . root', {stdio: 'ignore', cwd: rootDir})
    return true
  } catch (_) {
    // intentional noop
  }
  return false
}
