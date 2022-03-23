import fs from 'fs/promises'
import path from 'path'
import {isRecord, isString} from '../helpers'
import {TERM_DIVIDER} from './constants'

export async function clean(opts: {cwd: string}): Promise<void> {
  const {cwd} = opts
  const pkg = require(path.resolve(cwd, 'package.json'))
  const entries = Object.entries(pkg.exports)

  console.log(TERM_DIVIDER)

  for (const [entryPath, entry] of entries) {
    if (entryPath !== '.' && isRecord(entry) && isString(entry.require)) {
      const filePath = `${path.resolve(cwd, entryPath === '.' ? 'index' : entryPath)}.js`

      try {
        await fs.unlink(filePath)
        console.log('clean', path.relative(cwd, filePath))
      } catch (e) {
        console.log(`error ${e.message}`)
      }
    }
  }

  console.log(TERM_DIVIDER)
}
