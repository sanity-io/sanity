import fs from 'node:fs/promises'
import path from 'node:path'

import pkgDir from 'pkg-dir'

import {type PackageJson} from '../types'

export async function getCliPkg(): Promise<PackageJson> {
  const cliPath = pkgDir.sync(__dirname)

  if (!cliPath) {
    throw new Error('Unable to resolve root of @sanity/cli module')
  }

  let data: string | undefined
  try {
    data = await fs.readFile(path.join(cliPath, 'package.json'), 'utf-8')
  } catch (err) {
    throw new Error(`Unable to read @sanity/cli/package.json: ${err.message}`, {cause: err})
  }

  return JSON.parse(data)
}

export async function getCliVersion(): Promise<string> {
  return (await getCliPkg()).version
}
