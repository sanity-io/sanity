import {Card, Container, Flex, LayerProvider} from '@sanity/ui'
import React from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {TestInput} from '../TestInput'
import {schema, portableTextType} from './schema'
import {values, valueOptions} from './values'

export default function Story() {
  const readOnly = useBoolean('Read only', false)
  const selectedValue = useSelect('Values', valueOptions) || 'empty'
  const value = values[selectedValue]

  return (
    <LayerProvider zOffset={100}>
      <Card height="fill" overflow="hidden" padding={4} sizing="border">
        <Flex align="center" height="fill" justify="center">
          <Container width={1}>
            <TestInput readOnly={readOnly} value={value} type={portableTextType} schema={schema} />
          </Container>
        </Flex>
      </Card>
    </LayerProvider>
  )
}
