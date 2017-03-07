const {configure, setAddon} = require('@kadira/storybook')
const infoAddon = require('@kadira/react-storybook-addon-info')

require('normalize.css')
require('part:@sanity/base/theme/body-style')
require('./styles.css')

setAddon(infoAddon.default || infoAddon)

configure(
  () => require('all:part:@sanity/base/component'),
  module
)
