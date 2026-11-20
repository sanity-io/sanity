import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import path from 'node:path'

import {MONOREPO_ROOT} from '@repo/utils'

export interface PublishedPackagesDeps {
  repoRoot?: string
  listDirectories?: (repoRoot: string) => string
  readManifest?: (manifestPath: string) => string
}

function runListScript(repoRoot: string): string {
  return execFileSync('pnpm', ['--silent', 'tsx', 'scripts/listPublishedPackages.ts'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

export function parseDirectories(scriptOutput: string): string[] {
  return scriptOutput.split(/\s+/).filter(Boolean)
}

export function listPublishedPackageNames(deps: PublishedPackagesDeps = {}): string[] {
  const {
    repoRoot = MONOREPO_ROOT,
    listDirectories = runListScript,
    readManifest = (manifestPath) => readFileSync(manifestPath, 'utf8'),
  } = deps
  return parseDirectories(listDirectories(repoRoot))
    .map((directory) => {
      const manifest = JSON.parse(readManifest(path.join(repoRoot, directory, 'package.json'))) as {
        name?: string
      }
      if (!manifest.name) throw new Error(`${directory}/package.json has no name`)
      return manifest.name
    })
    .toSorted()
}
