import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'

storiesOf('Loading')
.addWithInfo(
  'Spinner',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
