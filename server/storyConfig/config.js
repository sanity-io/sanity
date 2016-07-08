const storyBook = require('../..')
const infoAddon = require('@kadira/react-storybook-addon-info')

require('style:@sanity/base/theme/body')

storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:story:@sanity/base/component'),
  module
)
