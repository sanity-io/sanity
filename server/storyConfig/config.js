const storyBook = require('../..')
const infoAddon = require('@kadira/react-storybook-addon-info')
storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:story:@sanity/base/component'),
  module
)
