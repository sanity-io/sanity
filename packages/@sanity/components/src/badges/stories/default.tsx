import {text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import DefaultBadge from 'part:@sanity/components/badges/default'
import React from 'react'

const colors = [undefined, 'success', 'danger', 'warning', 'info']

export function DefaultStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/badges/default" propTables={[DefaultBadge]}>
        <DefaultBadge
          color={select('Color', colors, undefined, 'props')}
          title={text('Title', 'Hint hint hint!', 'props')}
        >
          {text('Text', 'Text', 'props')}
        </DefaultBadge>
      </Sanity>
    </CenteredContainer>
  )
}
