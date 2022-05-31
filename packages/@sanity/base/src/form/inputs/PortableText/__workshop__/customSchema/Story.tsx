import {Card, Container, Flex, LayerProvider} from '@sanity/ui'
import React from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {TestInput} from '../_common/TestInput'
import {FIXME} from '../../../../types'
import {schema, portableTextType} from './schema'
import {values, valueOptions} from './values'
import {renderCustomMarkers} from './customMarkers'
import {renderBlockActions} from './blockActions'

export default function Story() {
  const readOnly = useBoolean('Read only', false)
  const withError = useBoolean('With error', false)
  const withWarning = useBoolean('With warning', false)
  const withCustomMarkers = useBoolean('With custom markers', false)
  const selectedValue = useSelect('Values', valueOptions) || 'empty'
  const value = values[selectedValue]

  return (
    <LayerProvider zOffset={100}>
      <Card height="fill" padding={4} sizing="border">
        <Flex align="center" height="fill" justify="center">
          <Container width={1}>
            <>TODO</>
            {/* <TestInput
              readOnly={readOnly}
              schema={schema}
              type={portableTextType as FIXME}
              value={value || []}
              withError={withError}
              withWarning={withWarning}
              withCustomMarkers={withCustomMarkers}
              renderCustomMarkers={renderCustomMarkers}
              renderBlockActions={renderBlockActions}
            /> */}
          </Container>
        </Flex>
      </Card>
    </LayerProvider>
  )
}
