import {execFile, spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {promisify} from 'node:util'

import {renderStudioConfig, type StudioConfigOptions} from './studioConfig'

const execFileAsync = promisify(execFile)

const STUDIO_DIR = 'dev/starter-studio'
const STUDIO_PACKAGE = 'sanity-starter-studio'

export interface BuiltVersion {
  /** Directory of the production build, ready to be served statically. */
  distDir: string
  ref: string
  sanityVersion: string
  sha: string
}

export interface PrepareVersionOptions {
  studio: StudioConfigOptions
  /** Reuse a previous build in the work directory instead of building again. */
  reuse: boolean
  ref: string
  repoRoot: string
  workDir: string
}

async function git(repoRoot: string, args: string[]): Promise<string> {
  const {stdout} = await execFileAsync('git', args, {cwd: repoRoot})
  return stdout.trim()
}

async function resolveSha(repoRoot: string, ref: string): Promise<string> {
  // A branch name means the remote one: a local branch of the same name may be stale.
  const candidates = ref === 'HEAD' ? [ref] : [`refs/remotes/origin/${ref}`, ref]
  for (const candidate of candidates) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- candidates are tried in order
      return await git(repoRoot, ['rev-parse', '--verify', `${candidate}^{commit}`])
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Cannot resolve git ref "${ref}". Fetch it first (git fetch origin ${ref}).`)
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, stdio: 'inherit'})
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)),
    )
  })
}

/**
 * Checks `ref` out into its own git worktree, builds the comparison studio from it in
 * production mode, and returns where the build landed.
 */
export async function prepareVersion(options: PrepareVersionOptions): Promise<BuiltVersion> {
  const {ref, repoRoot, reuse, studio, workDir} = options
  const sha = await resolveSha(repoRoot, ref)
  const checkout = path.join(workDir, sha.slice(0, 12))
  const distDir = path.join(checkout, STUDIO_DIR, 'dist')

  if (!(reuse && existsSync(path.join(distDir, 'index.html')))) {
    if (existsSync(checkout)) {
      await git(repoRoot, ['worktree', 'remove', '--force', checkout])
      await rm(checkout, {force: true, recursive: true})
    }
    await git(repoRoot, ['worktree', 'add', '--detach', checkout, sha])

    const {cli, config} = renderStudioConfig(studio)
    await writeFile(path.join(checkout, STUDIO_DIR, 'sanity.cli.ts'), cli)
    await writeFile(path.join(checkout, STUDIO_DIR, 'sanity.config.ts'), config)

    await run('pnpm', ['install', '--frozen-lockfile'], checkout)
    // `name...` builds the studio's workspace dependencies first, in topological order.
    await run('pnpm', ['--filter', `${STUDIO_PACKAGE}...`, 'run', 'build'], checkout)
  }

  const manifest = JSON.parse(
    await readFile(path.join(checkout, 'packages/sanity/package.json'), 'utf8'),
  ) as {version: string}

  return {distDir, ref, sanityVersion: manifest.version, sha}
}
