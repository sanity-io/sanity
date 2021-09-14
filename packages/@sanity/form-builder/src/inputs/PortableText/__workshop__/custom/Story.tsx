import {Card, Container, Flex, LayerProvider} from '@sanity/ui'
import React from 'react'
import {useSelect} from '@sanity/ui-workshop'
import {TestInput} from '../TestInput'
import {schema, portableTextType} from './schema'
import {values, valueOptions} from './values'

export default function Story() {
  const selectedValue = useSelect('Values', valueOptions) || 'empty'
  const value = values[selectedValue]

  return (
    <LayerProvider>
      <Card height="fill" padding={4}>
        <Flex align="center" height="fill" justify="center">
          <Container width={0}>
            <TestInput value={value} type={portableTextType} schema={schema} />
          </Container>
        </Flex>
      </Card>
    </LayerProvider>
  )
}
