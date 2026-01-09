const path = require('node:path')
const _pkg = require('@repo/test-exports/package.json')

const {dependencies} = _pkg

function validateSourceCondition(workspace, key, value, publishConfigExports) {
  if (!('source' in value)) return

  if (!('monorepo' in value)) {
    throw new Error(
      `${workspace}: exports["${key}"] has "source" condition but no "monorepo" condition`,
    )
  }
  if (!publishConfigExports?.[key]) {
    throw new Error(
      `${workspace}: exports["${key}"] has "source" condition but no matching publishConfig.exports["${key}"] entry`,
    )
  }
}

module.exports = (condition) => {
  if (!condition) {
    throw new TypeError('condition is required')
  }
  const workspaces = {}
  for (const workspace of Object.keys(dependencies)) {
    // eslint-disable-next-line import/no-dynamic-require
    const pkg = require(`${workspace}/package.json`)
    workspaces[workspace] = []
    if (!pkg.exports) continue

    for (const [key, value] of Object.entries(pkg.exports)) {
      if (typeof value !== 'object' || value === null) continue

      validateSourceCondition(workspace, key, value, pkg.publishConfig?.exports)

      if (condition in value) {
        workspaces[workspace].push(path.join(workspace, key))
      }
    }
  }

  return workspaces
}
