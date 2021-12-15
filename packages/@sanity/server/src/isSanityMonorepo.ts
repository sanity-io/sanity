import {readFile} from 'fs/promises'
import path from 'path'
import readPkgUp from 'read-pkg-up'

async function readJSONFile(filePath: string) {
  const buf = await readFile(filePath)

  return JSON.parse(buf.toString())
}

export async function isSanityMonorepo(basePath: string): Promise<boolean> {
  const {path: configPath} = (await readPkgUp({cwd: basePath})) || {}

  if (!configPath) {
    return false
  }

  try {
    const pkg = await readJSONFile(configPath)

    if (pkg.isSanityMonorepo) {
      return true
    }
  } catch (err) {
    return false
  }

  return isSanityMonorepo(path.dirname(path.dirname(configPath)))
}
