import fs from 'fs'
import path from 'path'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function resolveTsconfigPath(opts: {cwd: string; tsconfig?: string}): string | undefined {
  const {cwd, tsconfig = 'tsconfig.json'} = opts
  const tsconfigPath = path.resolve(cwd, tsconfig)

  if (!tsconfigPath.includes('packages/')) {
    throw new Error('must be in package')
  }

  let tsconfigExists = false

  try {
    // eslint-disable-next-line no-bitwise
    fs.accessSync(tsconfigPath, fs.constants.R_OK | fs.constants.W_OK)
    tsconfigExists = true
  } catch (e) {
    tsconfigExists = false
  }

  return tsconfigExists ? tsconfigPath : undefined
}
