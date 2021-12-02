import path from 'path'
import {isRecord, isString} from '../helpers'

export function _resolveExternal(opts: {pkg: any}): string[] {
  const {pkg} = opts
  const external: string[] = []

  for (const [name] of Object.entries(pkg.dependencies || {})) {
    external.push(name)
  }

  for (const [name] of Object.entries(pkg.devDependencies || {})) {
    external.push(name)
  }

  return external
}

export function _resolveInput(opts: {
  cwd: string
  outDir: string
  pkg: any
}): Record<string, string> {
  const {cwd, outDir, pkg} = opts

  const input: Record<string, string> = {}

  for (const [, moduleMap] of Object.entries(pkg.exports || {})) {
    const entry = {
      source: isRecord(moduleMap) && moduleMap.source,
      require: isRecord(moduleMap) && moduleMap.require,
      default: isRecord(moduleMap) && moduleMap.default,
    }

    if (!isString(entry.source)) {
      throw new Error('entry missing `source`')
    }

    if (!isString(entry.require)) {
      throw new Error('entry missing `require`')
    }

    if (!isString(entry.default)) {
      throw new Error('entry missing `default`')
    }

    const inputFile = path.resolve(cwd, entry.source)
    const basename = path.relative(outDir, path.resolve(cwd, entry.default))
    const name = basename.replace(/\.[^/.]+$/, '') // trim extension

    input[name] = inputFile
  }

  if (Object.keys(input).length === 0) {
    throw new Error('no export entries detected')
  }

  return input
}
