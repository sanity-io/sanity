import fs from 'fs'
import os from 'os'
import path from 'path'

export function validateEmptyPath(dir: string): true | string {
  const checkPath = absolutify(dir)
  return pathIsEmpty(checkPath) ? true : 'Given path is not empty'
}

export function absolutify(dir: string): string {
  const pathName = expandHome(dir)
  return path.isAbsolute(pathName) ? pathName : path.resolve(process.cwd(), pathName)
}

function pathIsEmpty(dir: string): boolean {
  try {
    // eslint-disable-next-line no-sync
    const content = fs.readdirSync(dir)
    return content.length === 0
  } catch (err) {
    if (err.code === 'ENOENT') {
      return true
    }

    throw err
  }
}

function expandHome(filePath: string): string {
  if (filePath.charCodeAt(0) === 126 /* ~ */) {
    if (filePath.charCodeAt(1) === 43 /* + */) {
      return path.join(process.cwd(), filePath.slice(2))
    }

    const home = os.homedir()
    return home ? path.join(home, filePath.slice(1)) : filePath
  }

  return filePath
}
