const {test} = require('node:test')

const getExports = require('./exports.cjs')

const workspaces = getExports('require')

for (const [workspace, paths] of Object.entries(workspaces)) {
  test(workspace, async (t) => {
    if (paths.length === 0) {
      t.todo('No "exports" found in package.json')
      return
    }
    for (const path of paths) {
      await t.test(`require('${path}')`, () => {
        // eslint-disable-next-line import/no-dynamic-require
        require(path)
      })
    }
  })
}
