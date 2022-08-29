import React from 'react'
import styled from 'styled-components'
import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import {BooleanInputProps} from '../types'
import {FormFieldHeaderText} from '../components/formField/FormFieldHeaderText'
import {FormFieldStatus} from '../components/formField/FormFieldStatus'

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

export function BooleanInput(props: BooleanInputProps) {
  const {id, value, schemaType, readOnly, elementProps} = props
  const layout = schemaType.options?.layout || 'switch'

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  return (
    <Card border radius={1}>
      <Flex>
        <ZeroLineHeightBox padding={3}>
          <LayoutSpecificInput
            label={schemaType.title}
            {...elementProps}
            indeterminate={indeterminate}
            checked={checked}
            style={{margin: -4}}
            disabled={readOnly}
          />
        </ZeroLineHeightBox>
        <Box flex={1} paddingY={3}>
          <FormFieldHeaderText
            description={schemaType.description}
            inputId={id}
            // validation={validation}
            title={schemaType.title}
          />
        </Box>
        <CenterAlignedBox paddingX={3} paddingY={1}>
          <FormFieldStatus maxAvatars={1} position="top">
            {/*<FieldPresence maxAvatars={1} presence={presence} />*/}
          </FormFieldStatus>
        </CenterAlignedBox>
      </Flex>
    </Card>
  )
}
