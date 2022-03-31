import fs from 'fs'
import util from 'util'

export function _parsePackageName(nameStr: string): [string | undefined, string] {
  const p = nameStr.split('/')

  const packageScope = p.length > 1 ? p[0] : undefined
  const packageName = p.length > 1 ? p[1] : p[0]

  return [packageScope, packageName]
}

export function _encodePackageName(scope: string | undefined, name: string): string {
  return [scope, name].filter(Boolean).join('/')
}

export const readFile = util.promisify(fs.readFile)
export const writeFile = util.promisify(fs.writeFile)

export async function readJSONFile(filePath: string): Promise<unknown> {
  const buf = await readFile(filePath)

  return JSON.parse(buf.toString())
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
