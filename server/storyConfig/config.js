const storyBook = require('component:@sanity/storybook')
const infoAddon = require('@sanity/react-storybook-addon-info')

require('style:@sanity/base/theme/body')
require('style:@sanity/base/theme/normalize')
require('./styles.css')

storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:story:@sanity/base/component'),
  module
)
