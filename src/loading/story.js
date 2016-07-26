import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'

import Spinner from 'component:@sanity/components/loading/spinner'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'


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
