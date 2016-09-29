import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'

storiesOf('Loading')
.addWithInfo(
  'Spinner',
  `
    Spinner block
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
.addWithInfo(
  'Spinner inline',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner inline />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
.addWithInfo(
  'Spinner with message',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner message="Loading" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
.addWithInfo(
  'Spinner inline with message',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner inline message="Loading" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)

.addWithInfo(
  'Spinner fullscreen',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner fullscreen message="Loading" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
