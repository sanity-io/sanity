const path = require('path')
const {createJestConfig} = require('../../../test/config')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createJestConfig({
  displayName: require('./package.json').name,
  rootDir: __dirname,
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  moduleNameMapper: {
    'part:@sanity/form-builder/input/block-editor/block-markers-custom-default': path.resolve(
      __dirname,
      'src/inputs/PortableText/_legacyDefaultParts/CustomMarkers.tsx'
    ),
    'part:@sanity/form-builder/input/block-editor/block-markers': path.resolve(
      __dirname,
      'src/inputs/PortableText/_legacyDefaultParts/Markers.tsx'
    ),
    '^part:@sanity/form-builder*': path.resolve(__dirname, '../../../test/mocks/undefined'),
  },
})
