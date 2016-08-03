import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'

import Spinner from 'component:@sanity/components/loading/spinner'

import centered from '../storybook-addons/centered.js'
require('../storybook-addons/role.js')

storiesOf('Loading')
.addDecorator(centered)
.addWithRole(
  'Spinner',
  `
    Spinner
  `,
  'component:@sanity/components/loading/spinner',
  () => {
    return (
      <Spinner />
    )
  },
  {propTables: [Spinner]}
)
