/* eslint-disable import/no-unresolved */

import React, {useCallback} from 'react'
import styled from 'styled-components'
import {useId} from '@reach/auto-id'
import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import {BooleanSchemaType} from '@sanity/types'
import {FormFieldHeaderText, FormFieldStatus} from '../../components/formField'
import {FieldPresence} from '../../presence'
import {FormInputProps} from '../types'
import {PatchEvent, set} from '../patch'
import {ChangeIndicator} from '../../components/changeIndicators'

export type BooleanInputProps = FormInputProps<boolean, BooleanSchemaType>

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

export const BooleanInput = React.forwardRef(function BooleanInput(
  props: BooleanInputProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {onChange} = props
  const {value, type, readOnly, onFocus, validation, presence} = props
  const layout = type.options?.layout || 'switch'
  const inputId = useId()

  const handleChange = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      onChange(PatchEvent.from(set(event.currentTarget.checked)))
    },
    [onChange]
  )

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  return (
    <ChangeIndicator>
      <Card border radius={1}>
        <Flex>
          <ZeroLineHeightBox padding={3}>
            <LayoutSpecificInput
              id={inputId}
              ref={ref}
              label={type.title}
              readOnly={Boolean(readOnly)}
              onChange={handleChange}
              onFocus={onFocus}
              indeterminate={indeterminate}
              checked={checked}
              style={{margin: -4}}
              disabled={readOnly}
            />
          </ZeroLineHeightBox>
          <Box flex={1} paddingY={3}>
            <FormFieldHeaderText
              description={type.description}
              inputId={inputId}
              validation={validation}
              title={type.title}
            />
          </Box>
          <CenterAlignedBox paddingX={3} paddingY={1}>
            <FormFieldStatus maxAvatars={1} position="top">
              <FieldPresence maxAvatars={1} presence={presence} />
            </FormFieldStatus>
          </CenterAlignedBox>
        </Flex>
      </Card>
    </ChangeIndicator>
  )
})
