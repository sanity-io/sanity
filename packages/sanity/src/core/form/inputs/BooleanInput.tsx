import React from 'react'
import styled from 'styled-components'
import {Box, Card, CardTone, Checkbox, Flex, Switch} from '@sanity/ui'
import {BooleanInputProps} from '../types'
import {FormFieldHeaderText} from '../components/formField/FormFieldHeaderText'
import {FormFieldStatus} from '../components/formField/FormFieldStatus'

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

/**
 *
 * @hidden
 * @beta
 */
export function BooleanInput(props: BooleanInputProps) {
  const {id, value, schemaType, readOnly, elementProps, validation} = props
  const layout = schemaType.options?.layout || 'switch'

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const tone: CardTone | undefined = readOnly ? 'transparent' : undefined

  return (
    <Card border data-testid="boolean-input" radius={2} tone={tone}>
      <Flex>
        <ZeroLineHeightBox padding={3}>
          <LayoutSpecificInput
            label={schemaType.title}
            {...elementProps}
            checked={checked}
            disabled={readOnly}
            indeterminate={indeterminate}
            style={{margin: -4}}
          />
        </ZeroLineHeightBox>
        <Box flex={1} paddingY={3}>
          <FormFieldHeaderText
            description={schemaType.description}
            inputId={id}
            validation={validation}
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
