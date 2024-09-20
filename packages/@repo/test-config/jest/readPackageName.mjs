import fs from 'node:fs'
import path from 'node:path'
import {resolveDirName} from './resolveDirName.mjs'

export function readPackageName(dirNameUrl) {
  return JSON.parse(fs.readFileSync(path.join(resolveDirName(dirNameUrl), 'package.json'), 'utf-8'))
    .name
}
