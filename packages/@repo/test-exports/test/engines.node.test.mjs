import assert from 'node:assert/strict'
import {execSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

const EXPECTED_NODE_ENGINE = '>=22.12'
const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
const packagesDir = path.join(repoRoot, 'packages')

const packages = JSON.parse(
  execSync('pnpm ls -r --json --depth -1', {
    cwd: repoRoot,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  }),
)

for (const pkg of packages) {
  if (!pkg.path.startsWith(`${packagesDir}${path.sep}`)) continue

  const manifest = JSON.parse(readFileSync(path.join(pkg.path, 'package.json'), 'utf8'))
  if (manifest.private) continue

  void test(`${manifest.name} declares engines.node ${EXPECTED_NODE_ENGINE}`, () => {
    assert.equal(manifest.engines?.node, EXPECTED_NODE_ENGINE)
  })
}
