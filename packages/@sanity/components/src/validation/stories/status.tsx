import Chance from 'chance'
import {range} from 'lodash'
import ValidationStatus from 'part:@sanity/components/validation/status'
import {boolean} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'
import {Marker} from '../../types'

const chance = new Chance()

const mockMarkers = (length = 5): Marker[] =>
  range(length).map((_, i) => ({
    type: 'validation',
    level: 'error',
    path: [`test_${i}`],
    item: {
      message: chance.sentence()
    }
  }))

export function StatusStory() {
  const markers = mockMarkers()

  const hideTooltip = boolean('Hide tooltip', false, 'Props')
  const showSummary = boolean('Show summary', false, 'Props')

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
        <ValidationStatus hideTooltip={hideTooltip} markers={markers} showSummary={showSummary} />
      </Sanity>
    </CenteredContainer>
  )
}
