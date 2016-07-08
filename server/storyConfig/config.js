const storyBook = require('../..')
const infoAddon = require('@kadira/react-storybook-addon-info')

require('./reset.css')
require('./base.css')

storyBook.setAddon(infoAddon.default)

storyBook.configure(
  () => require('all:story:@sanity/base/component'),
  module
)
