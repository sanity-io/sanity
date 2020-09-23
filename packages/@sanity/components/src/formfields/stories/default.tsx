import React from 'react'
import Chance from 'chance'
import {range} from 'lodash'
import {ValidationMarker} from '@sanity/types'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

const chance = new Chance()

const mockValidationMarkers = (
  level: ValidationMarker['level'] = 'error',
  length = 5
): ValidationMarker[] => {
  return range(length).map((_, markerIndex) => ({
    type: 'validation',
    level,
    path: [`field_${markerIndex}`],
    item: {
      paths: [],
      path: ['title'],
      message: chance.sentence(),
      name: 'ValidationError',
      cloneWithMessage() {
        throw new Error('nope')
      }
    }
  }))
}

export function DefaultFormFieldStory() {
  const description = text('Description', 'Description', 'props')
  const id = 'storyFormField_Default1'
  const inline = boolean('Inline', false, 'props')
  const label = text('Label', 'Label', 'props')
  const level = number('Level', 1, {range: true, min: 1, max: 4, step: 1}, 'props')
  const value = text('Input value', 'foo', 'props')
  const wrapped = boolean('Wrapped', false, 'props')
  const errors = boolean('Errors', false, 'props')
  const warnings = boolean('Warnings', false, 'props')

  const markers = (errors ? mockValidationMarkers('error', 5) : []).concat(
    warnings ? mockValidationMarkers('warning', 5) : []
  )

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/formfields/default" propTables={[DefaultFormField]}>
        <div style={{width: '100%', maxWidth: 640}}>
          <DefaultFormField
            description={description}
            inline={inline}
            label={label}
            labelFor={id}
            level={level}
            markers={markers}
            wrapped={wrapped}
          >
            <DefaultTextInput id={id} value={value} />
          </DefaultFormField>
        </div>
      </Sanity>
    </CenteredContainer>
  )
}
