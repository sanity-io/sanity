const {test} = require('node:test')

const getExports = require('./exports.cjs')

const workspaces = getExports('require')

for (const [workspace, paths] of Object.entries(workspaces)) {
  test(workspace, async (t) => {
    for (const path of paths) {
      await t.test(path, () => {
        // eslint-disable-next-line import/no-dynamic-require
        require(path)
      })
    }
  })
}
