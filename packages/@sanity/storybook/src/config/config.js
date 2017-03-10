const {configure, sanity} = require('part:@sanity/storybook')

require('normalize.css')
require('part:@sanity/base/theme/body-style')
require('./styles.css')

configure(
  () => {
    // Trigger loading of stories (side-effect of registering them)
    require('all:part:@sanity/base/component')

    // Explicitly register declares stories (allows us to sort stories before registration)
    sanity.registerDeclaredStories()
  },
  module
)
