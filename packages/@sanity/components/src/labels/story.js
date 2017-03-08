import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultLabel from 'part:@sanity/components/labels/default'
import {withKnobs, number, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Labels')
  .addDecorator(withKnobs)
  .add(
  'Default',
  () => {
    return (
      <Sanity part="part:@sanity/components/labels/default" propTables={[DefaultLabel]}>
        <DefaultLabel level={number('level', 0)} htmlFor="thisNeedsToBeUnique">{text('content', 'Label')}</DefaultLabel>
      </Sanity>
    )
  }
)
