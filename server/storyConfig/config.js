const storyBook = require('part:@sanity/storybook')
const infoAddon = require('@kadira/react-storybook-addon-info')

require('part:@sanity/base/theme/body-style')
require('./styles.css')

storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:part:@sanity/base/component'),
  module
)
