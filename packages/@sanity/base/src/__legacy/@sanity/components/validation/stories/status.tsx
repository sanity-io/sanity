import React from 'react'
import Chance from 'chance'
import {range} from 'lodash'
import {ValidationMarker} from '@sanity/types'
import ValidationStatus from 'part:@sanity/components/validation/status'
import {boolean} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const chance = new Chance()

const mockMarkers = (length = 5): ValidationMarker[] =>
  range(length).map((_, i) => ({
    type: 'validation',
    level: 'error',
    path: [`test_${i}`],
    item: {
      message: chance.sentence() as string,
      paths: [],
      cloneWithMessage() {
        throw new Error('nope')
      },
    },
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
