import {execSync, spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import chalk from 'chalk'

main().catch((err) => {
  console.error(chalk.red(err))
  process.exit(1)
})

interface WorkspaceProject {
  name: string
  version: string
  path: string
  private?: boolean
}

/**
 * This script will "publish" all the npm modules in the monorepo to tarballs (.tgz) in
 * `<monorepoRootDir>/etc/npm/*.tgz`.
 *
 * This is useful to inspect the contents of the published modules.
 */
async function main() {
  const rootDir = path.resolve(import.meta.dirname, '../..')
  const projects: WorkspaceProject[] = JSON.parse(
    execSync('pnpm ls -r --json --depth -1', {cwd: rootDir, encoding: 'utf-8'}),
  )

  const versions: Record<string, string> = {}

  for (const pkg of projects) {
    if (!pkg.private) {
      const filename = path.resolve(rootDir, 'etc/npm', pkg.name, `v${pkg.version}.tgz`)
      const dirname = path.dirname(filename)

      await fs.mkdir(dirname, {recursive: true})
      await _pack({cwd: pkg.path, filename})

      versions[pkg.name] = pkg.version

      console.log(
        chalk.green('packed'),
        pkg.name,
        chalk.gray('→'),
        path.relative(process.cwd(), filename),
      )
    }
  }

  const versionsJsonPath = path.resolve(rootDir, 'etc/npm/versions.json')

  await fs.mkdir(path.dirname(versionsJsonPath), {recursive: true})

  await fs.writeFile(versionsJsonPath, `${JSON.stringify(versions, null, 2)}\n`)
}

function _pack(opts: {cwd: string; filename: string}): Promise<void> {
  const {cwd, filename} = opts

  return new Promise((resolve, reject) => {
    const stream = spawn('pnpm', ['pack', '--filename', filename], {cwd})

    stream.on('close', () => resolve())
    stream.on('error', (err) => reject(err))
  })
}
