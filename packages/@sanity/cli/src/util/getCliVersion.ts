import fs from 'fs/promises'
import path from 'path'
import pkgDir from 'pkg-dir'

export async function getCliVersion(): Promise<string> {
  const cliPath = pkgDir.sync(__dirname)

  if (!cliPath) {
    throw new Error('Unable to resolve root of @sanity/cli module')
  }

  let data: string | undefined
  try {
    data = await fs.readFile(path.join(cliPath, 'package.json'), 'utf-8')
  } catch (err) {
    throw new Error(`Unable to read @sanity/cli/package.json: ${err.message}`)
  }

  const pkg = JSON.parse(data)
  return pkg.version
}
