import {test} from 'node:test'

import getExports from './exports.cjs'

const workspaces = getExports('import')

for (const [workspace, paths] of Object.entries(workspaces)) {
  test(workspace, async (t) => {
    for (const path of paths) {
      // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars
      await t.test(path, async (t) => {
        await import(path)
      })
    }
  })
}
