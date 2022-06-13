/* eslint-disable import/no-unresolved */

import React, {useCallback} from 'react'
import styled from 'styled-components'
import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import {set} from '../patch'
import {ChangeIndicator} from '../../components/changeIndicators'
import {BooleanInputProps} from '../types'
import {FormFieldHeaderText} from '../components/formField/FormFieldHeaderText'
import {FormFieldStatus} from '../components/formField/FormFieldStatus'

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
  const {id, value, schemaType, readOnly, onBlur, onFocus, onChange, path, focused, changed} = props
  const layout = schemaType.options?.layout || 'switch'

  const handleChange = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      onChange(set(event.currentTarget.checked))
    },
    [onChange]
  )

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      <Card border radius={1}>
        <Flex>
          <ZeroLineHeightBox padding={3}>
            <LayoutSpecificInput
              id={id}
              ref={ref}
              label={schemaType.title}
              readOnly={Boolean(readOnly)}
              onBlur={onBlur}
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
    </ChangeIndicator>
  )
})
