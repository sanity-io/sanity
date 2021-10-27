const createConfig = require('../../../createJestConfig')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createConfig({
  displayName: require('./package.json').name,
})
