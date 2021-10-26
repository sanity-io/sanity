import {Box, Card, Container, Flex, LayerProvider, Text} from '@sanity/ui'
import React from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {CommentIcon, AddIcon} from '@sanity/icons'
import {keyGenerator} from '@sanity/portable-text-editor'
import {TestInput} from '../TestInput'
import {schema, portableTextType} from './schema'
import {values, valueOptions} from './values'

function renderCustomMarkers(markers) {
  return markers.map((marker, index) => {
    if (marker.type === 'customMarkerTest') {
      return (
        <Box key={`marker-${index}`}>
          <Flex>
            <Text size={1}>
              <CommentIcon /> Two comments
            </Text>
          </Flex>
        </Box>
      )
    }
    return null
  })
}

function renderBlockActions({block, insert}) {
  const dupBlock = {
    ...block,
    _key: keyGenerator(),
  }
  const handleClick = () => insert(dupBlock)
  return (
    <div>
      <AddIcon onClick={handleClick} />
    </div>
  )
}

export default function Story() {
  const readOnly = useBoolean('Read only', false)
  const withError = useBoolean('With error', false)
  const withCustomMarkers = useBoolean('With custom markers', false)
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
              withCustomMarkers={withCustomMarkers}
              renderCustomMarkers={renderCustomMarkers}
              renderBlockActions={renderBlockActions}
            />
          </Container>
        </Flex>
      </Card>
    </LayerProvider>
  )
}
