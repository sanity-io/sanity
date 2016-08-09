import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import DefaultLabel from 'component:@sanity/components/labels/default'

storiesOf('Labels')
  .addWithInfo(
  'Default',
  `
    Default label
  `,
  () => {
    return (
      <DefaultLabel htmlFor="thisNeedsToBeUnique" />
    )
  },
  {
    propTables: [DefaultLabel],
    role: 'component:@sanity/components/labels/default'
  }
)
