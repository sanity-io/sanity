// `sanity` and `sanity/structure` must both evaluate first, in a fresh process, in either order.
//
// Rolldown emits its `__exportAll` runtime helper into whichever chunk needs it first. A
// `lazy()` target that other modules also import statically makes rolldown synthesise a namespace
// object for it, which needs that helper; when the target lives in a shared chunk, the helper can
// land in a structure chunk that a core chunk then imports statically. Evaluating
// `sanity/structure` before `sanity` — the order the CLI's `schema deploy` worker uses when it
// evaluates `sanity.config.ts` — then hits the helper in its temporal dead zone and throws
// `__exportAll is not a function`, while the other order is fine. The repository's answer is a
// per-module `<Module>.lazy.ts` shim (`export {Foo as default} from './Foo'`), whose default
// export resolves inside its own chunk and needs no namespace object.
//
// This is the behavioural guard for that rule. Asserting which chunk `__exportAll` lands in would
// be a proxy; this reproduces the failure itself, and keeps working if rolldown changes where it
// puts its helpers.
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'

const execFileAsync = promisify(execFile)
const testDir = path.dirname(fileURLToPath(import.meta.url))
const packageDir = path.resolve(testDir, '..')
const browserEnv = path.join(testDir, 'mock-browser-env.mjs')

const ORDERS = [
  ['sanity/structure', 'sanity'],
  ['sanity', 'sanity/structure'],
]

for (const order of ORDERS) {
  void test(`evaluates ${order.join(' then ')} in a fresh process`, async () => {
    // One process per order: a shared module registry would hide the problem, because whichever
    // entry evaluated first would already have initialised the helper.
    const source = order.map((entry) => `await import(${JSON.stringify(entry)});`).join('\n')

    try {
      await execFileAsync(
        process.execPath,
        ['--import', browserEnv, '--input-type=module', '--eval', source],
        {cwd: packageDir, timeout: 120_000},
      )
    } catch (error) {
      assert.fail(
        `Importing ${order.join(' then ')} failed. A lazy() target that is also imported ` +
          `statically needs a <Module>.lazy.ts shim; see the lazy-loading section of AGENTS.md.\n\n` +
          `${error.stderr || error.message}`,
      )
    }
  })
}
