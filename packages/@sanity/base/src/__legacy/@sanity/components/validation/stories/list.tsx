import React from 'react'
import Chance from 'chance'
import {range} from 'lodash'
import {ValidationMarker} from '@sanity/types'
import ValidationStatus from 'part:@sanity/components/validation/status'
import ValidationList from 'part:@sanity/components/validation/list'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

const chance = new Chance()

const mockMarkers = (length = 5): ValidationMarker[] => {
  return range(length).map((marker, i) => ({
    type: 'validation',
    level: 'error',
    path: [`test_${i}`],
    item: {
      paths: [],
      path: ['title'],
      message: chance.sentence(),
      name: 'ValidationError',
      cloneWithMessage() {
        throw new Error('nope')
      },
    },
  }))
}

export function ListStory() {
  const markers = mockMarkers()
  const kind = select('Kind', {'': '(none)', simple: 'Simple'}, '', 'Props') || undefined
  const truncate = boolean('Truncate', false, 'Props')

  return (
    <CenteredContainer background={false}>
      <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
        <ValidationList
          kind={kind}
          markers={markers}
          onFocus={action('onFocus')}
          onClose={action('onClose')}
          truncate={truncate}
        />
      </Sanity>
    </CenteredContainer>
  )
}
