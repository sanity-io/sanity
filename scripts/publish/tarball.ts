import {spawn} from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import globby from 'globby'

main().catch((err) => {
  console.error(chalk.red(err))
  process.exit(1)
})

/**
 * This script will "publish" all the npm modules in the monorepo to tarballs (.tgz) in
 * `<monorepoRootDir>/etc/npm/*.tgz`.
 *
 * This is useful to inspect the contents of the published modules.
 */
async function main() {
  const root = require('../../package.json')
  const workspaces = root.workspaces as string[]
  const pkgJsonPaths = await globby(workspaces.map((p) => `${p}/package.json`))

  const versions: Record<string, string> = {}

  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = require(path.resolve(__dirname, '../..', pkgJsonPath))

    if (!pkg.private) {
      const cwd = path.dirname(pkgJsonPath)
      const filename = path.resolve(__dirname, '../../etc/npm/', pkg.name, `v${pkg.version}.tgz`)
      const dirname = path.dirname(filename)

      await fs.mkdir(dirname, {recursive: true})
      await _pack({cwd, filename})

      versions[pkg.name] = pkg.version

      console.log(
        chalk.green('packed'),
        pkg.name,
        chalk.gray('→'),
        path.relative(process.cwd(), filename)
      )
    }
  }

  const versionsJsonPath = path.resolve(__dirname, '../../etc/npm/versions.json')

  await fs.mkdir(path.dirname(versionsJsonPath), {recursive: true})

  await fs.writeFile(versionsJsonPath, `${JSON.stringify(versions, null, 2)}\n`)
}

function _pack(opts: {cwd: string; filename: string}): Promise<void> {
  const {cwd, filename} = opts

  return new Promise((resolve, reject) => {
    const stream = spawn('yarn', ['pack', '--filename', filename], {cwd})

    stream.on('close', () => resolve())
    stream.on('error', (err) => reject(err))
  })
}
