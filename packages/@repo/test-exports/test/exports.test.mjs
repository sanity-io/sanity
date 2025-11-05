import {test} from 'node:test'

import getExports from './exports.cjs'

const workspaces = getExports('import')

for (const [workspace, paths] of Object.entries(workspaces)) {
  void test(workspace, async (t) => {
    if (paths.length === 0) {
      t.todo('No "exports" found in package.json')
      return
    }
    for (const path of paths) {
      // Awaiting during the loop is fine, and intentional here, we want tests to run in serial
      // oxlint-disable-next-line no-await-in-loop
      await t.test(
        `await import('${path}')`,
        async (
          // eslint-disable-next-line @typescript-eslint/no-shadow
          t,
        ) => {
          try {
            await import(path)
          } catch (error) {
            if (workspace === '@sanity/cli' || workspace === '@sanity/codegen') {
              t.todo('native ESM not supported yet')
            } else {
              throw error
            }
          }
        },
      )
    }
  })
}
