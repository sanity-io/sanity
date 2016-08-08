import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'

import Spinner from 'component:@sanity/components/loading/spinner'

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
    role: 'component:@sanity/components/loading/spinner'
  }
)
