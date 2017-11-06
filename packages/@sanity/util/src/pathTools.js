import fse from 'fs-extra'
import path from 'path'
import os from 'os'

export async function pathIsEmpty(dir) {
  try {
    const content = await fse.readdir(absolutify(dir))
    return content.length === 0
  } catch (err) {
    if (err.code === 'ENOENT') {
      return true
    }

    throw err
  }
}

export function expandHome(filePath) {
  if (filePath.charCodeAt(0) === 126 /* ~ */) {
    if (filePath.charCodeAt(1) === 43 /* + */) {
      return path.join(process.cwd(), filePath.slice(2))
    }

    const home = os.homedir()
    return home ? path.join(home, filePath.slice(1)) : filePath
  }

  return filePath
}

export function absolutify(dir) {
  const pathName = expandHome(dir)
  return path.isAbsolute(pathName)
    ? pathName
    : path.resolve(process.cwd(), pathName)
}
