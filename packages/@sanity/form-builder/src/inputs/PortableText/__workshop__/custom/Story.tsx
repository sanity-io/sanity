import {Box, Button, Card, Container, Flex, LayerProvider, Text} from '@sanity/ui'
import React from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {CommentIcon, AddIcon} from '@sanity/icons'
import {keyGenerator} from '@sanity/portable-text-editor'
import {TestInput} from '../_common/TestInput'
import {schema, portableTextType} from './schema'
import {values, valueOptions} from './values'

function renderCustomMarkers(markers) {
  return markers.map((marker) => {
    if (marker.type === 'customMarkerTest') {
      return (
        <Box key={`marker-${marker.type}-${JSON.stringify(marker.path)}`}>
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
  if (dupBlock.children) {
    dupBlock.children = dupBlock.children.map((c) => ({...c, _key: keyGenerator()}))
  }
  const handleClick = () => insert(dupBlock)
  return (
    <div>
      <Button fontSize={1} icon={AddIcon} onClick={handleClick} padding={2} mode="bleed" />
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
