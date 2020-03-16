/* eslint-disable no-sync */
const fs = require('fs')
const readPackages = require('./readPackages')

module.exports = function transformPkgs(mapFn) {
  readPackages().forEach(pkg => {
    const result = mapFn(pkg.content)
    fs.writeFileSync(pkg.path, `${JSON.stringify(result, null, 2)}\n`)
  })
}
