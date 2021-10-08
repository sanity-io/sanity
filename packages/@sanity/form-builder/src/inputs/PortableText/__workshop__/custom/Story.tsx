import {Card, Container, Flex, LayerProvider} from '@sanity/ui'
import React from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {TestInput} from '../TestInput'
import {schema, portableTextType, blockType} from './schema'
import {values, valueOptions} from './values'

export default function Story() {
  const readOnly = useBoolean('Read only', false)
  const withError = useBoolean('With error', false)
  const selectedValue = useSelect('Values', valueOptions) || 'empty'
  const value = values[selectedValue]
  return (
    <LayerProvider zOffset={100}>
      <Card height="fill" padding={4} sizing="border">
        <Flex align="center" height="fill" justify="center">
          <Container width={1}>
            <TestInput
              readOnly={readOnly}
              schema={schema}
              type={portableTextType}
              value={value}
              withError={withError}
            />
          </Container>
        </Flex>
      </Card>
    </LayerProvider>
  )
}
