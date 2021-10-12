const path = require('path')
const createConfig = require('../../../createJestConfig')

module.exports = createConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  moduleNameMapper: {
    'part:@sanity/form-builder/input/block-editor/block-extras': path.resolve(
      __dirname,
      'src/inputs/PortableText/legacyParts/BlockExtras.tsx'
    ),
    'part:@sanity/form-builder/input/block-editor/block-markers-custom-default': path.resolve(
      __dirname,
      'src/inputs/PortableText/legacyParts/CustomMarkers.tsx'
    ),
    'part:@sanity/form-builder/input/block-editor/block-markers': path.resolve(
      __dirname,
      'src/inputs/PortableText/legacyParts/Markers.tsx'
    ),
    '^part:@sanity/form-builder*': path.resolve(__dirname, '../../../test/undefined'),
  },
})
