const storyBook = require('component:@sanity/storybook')
const infoAddon = require('@kadira/react-storybook-addon-info')

require('style:@sanity/base/theme/body')
require('./styles.css')

storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:story:@sanity/base/component'),
  module
)
