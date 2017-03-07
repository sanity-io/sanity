import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultLabel from 'part:@sanity/components/labels/default'
import {withKnobs, number, text} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Labels')
  .addDecorator(withKnobs)
  .add(
  'Default',
  () => {
    return (
      <DefaultLabel level={number('level', 0)} htmlFor="thisNeedsToBeUnique">{text('content', 'Label')}</DefaultLabel>
    )
  },
  {
    propTables: [DefaultLabel],
    role: 'part:@sanity/components/labels/default'
  }
)
