const path = require('path')
const createConfig = require('../../../createJestConfig')

module.exports = createConfig({
  displayName: require('./package.json').name,
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
    '^part:@sanity/form-builder*': path.resolve(__dirname, '../../../test/undefined'),
  },
})
