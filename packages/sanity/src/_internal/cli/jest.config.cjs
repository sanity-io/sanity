const {createJestConfig} = require('../../../../../test/config.cjs')
const path = require('node:path')

module.exports = createJestConfig({
  displayName: `${require('../../../package.json').name}/${path.basename(__dirname)}`,
  testEnvironment: 'node',
})
