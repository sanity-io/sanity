import {select} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import DefaultBadge from 'part:@sanity/components/badges/default'
import React from 'react'

const colors = [undefined, 'success', 'danger', 'warning', 'info']

export function ExampleInTextStory() {
  return (
    <CenteredContainer>
      <div>
        Lorem ipsum{' '}
        <DefaultBadge color={select('Color', colors, undefined, 'props')}>sit dolor</DefaultBadge>
      </div>
    </CenteredContainer>
  )
}
