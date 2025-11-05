// eslint-disable-next-line @typescript-eslint/no-require-imports
const {test} = require('node:test')

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getExports = require('./exports.cjs')

const workspaces = getExports('require')

for (const [workspace, paths] of Object.entries(workspaces)) {
  void test(workspace, async (t) => {
    if (paths.length === 0) {
      t.todo('No "exports" found in package.json')
      return
    }
    for (const path of paths) {
      // Awaiting during the loop is fine, and intentional here, we want tests to run in serial
      // oxlint-disable-next-line no-await-in-loop
      await t.test(`require('${path}')`, () => {
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports
        require(path)
      })
    }
  })
}
