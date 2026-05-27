import {existsSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PACKAGE_DIR = resolve(SCRIPT_DIR, '..')
const REPO_ROOT_DIR = resolve(PACKAGE_DIR, '../..')
const LOCAL_ENV_FILES = [resolve(PACKAGE_DIR, '.env'), resolve(REPO_ROOT_DIR, '.env')]

export interface MiriadEnv {
  url: string
  token: string
  spaceId: string
}

export interface MiriadEnvSource {
  MIRIAD_URL?: string | undefined
  MIRIAD_TOKEN?: string | undefined
  MIRIAD_SPACE_ID?: string | undefined
}

export function loadLocalEnv(log: (msg: string) => void): void {
  for (const envFile of LOCAL_ENV_FILES) {
    if (!existsSync(envFile)) continue

    log(`loading local env from ${envFile}`)
    const contents = readFileSync(envFile, 'utf8')
    for (const rawLine of contents.split(/\r?\n/)) {
      const parsed = parseEnvLine(rawLine)
      if (!parsed) continue

      const {key, value} = parsed
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

export function resolveMiriadEnv(source: MiriadEnvSource): MiriadEnv {
  const url = source.MIRIAD_URL
  const token = source.MIRIAD_TOKEN
  const spaceId = source.MIRIAD_SPACE_ID

  if (!url) throw new Error('MIRIAD_URL is not set (see scripts/trigger-triage/README.md)')
  if (!token) throw new Error('MIRIAD_TOKEN is not set (see scripts/trigger-triage/README.md)')
  if (!spaceId) throw new Error('MIRIAD_SPACE_ID is not set (see scripts/trigger-triage/README.md)')

  return {url, token, spaceId}
}

function parseEnvLine(rawLine: string): {key: string; value: string} | null {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) return null

  const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line
  const separator = normalized.indexOf('=')
  if (separator <= 0) return null

  const key = normalized.slice(0, separator).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null

  const rawValue = normalized.slice(separator + 1).trim()
  return {key, value: unquoteEnvValue(rawValue)}
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
