import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultLabel from 'part:@sanity/components/labels/default'

storiesOf('Labels')
  .addWithInfo(
  'Default',
  `
    Default label
  `,
  () => {
    return (
      <DefaultLabel htmlFor="thisNeedsToBeUnique">This is an label</DefaultLabel>
    )
  },
  {
    propTables: [DefaultLabel],
    role: 'part:@sanity/components/labels/default'
  }
)
