#!/usr/bin/env tsx
import {execSync} from 'node:child_process'
import {createRequire} from 'node:module'

const requireFrom = createRequire(import.meta.url)

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[/\s]+/g, '-') // slashes & whitespace -> dash
    .replace(/[^a-z0-9-]+/g, '-') // everything else -> dash
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
}

function exec(cmd: string): string | undefined {
  return execSync(cmd, {stdio: ['ignore', 'pipe', 'ignore']})
    .toString()
    .trim()
}

function getVersion({pr, branch}: {pr?: string; branch?: string}) {
  // The studio reports the version of the `sanity` package it bundles. This app's own
  // package.json is private, and the release bump deliberately skips private packages
  // (see `selectPackagesToBump` in @repo/release-notes), so its version never moves.
  const version: string = requireFrom('sanity/package.json').version

  const COMMIT_HASH = exec('git rev-parse --short HEAD')

  if (pr) {
    // e.g. 1.2.3-pr.123+abc1234
    return `${version}-pr.${pr}+${COMMIT_HASH}`
  }

  if (branch) {
    // e.g. 1.2.3-git.feature-x+abc1234
    return `${version}-git.${slugify(branch)}+${COMMIT_HASH}`
  }
  return version
}
// Prefer Vercel envs when available, fall back to local git
const PR_ID = process.env.VERCEL_GIT_PULL_REQUEST_ID
const BRANCH_NAME = process.env.VERCEL_GIT_COMMIT_REF

if (PR_ID || BRANCH_NAME) {
  console.log(getVersion({pr: PR_ID, branch: BRANCH_NAME}))
} else {
  // intentionally produce no output to avoid stale hashes when switching branches/commits during local dev.
}
