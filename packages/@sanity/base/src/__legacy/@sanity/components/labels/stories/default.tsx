import DefaultLabel from 'part:@sanity/components/labels/default'
import {number, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/labels/default" propTables={[DefaultLabel]}>
        <DefaultLabel level={number('level (prop)', 0)} htmlFor="thisNeedsToBeUnique">
          {text('children  (prop)', 'Label')}
        </DefaultLabel>
      </Sanity>
    </CenteredContainer>
  )
}
