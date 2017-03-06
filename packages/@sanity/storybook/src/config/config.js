import {configure, setAddon} from '@kadira/storybook'
import infoAddon from '@kadira/react-storybook-addon-info'

require('normalize.css')
require('part:@sanity/base/theme/body-style')
require('./styles.css')

setAddon(infoAddon)

configure(
  () => require('all:part:@sanity/base/component'),
  module
)
