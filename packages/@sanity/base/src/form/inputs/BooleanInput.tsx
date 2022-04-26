import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {ChangeIndicator} from '../../components/changeIndicators'
import {FormFieldHeaderText, FormFieldStatus} from '../../components/formField'
import {FieldPresence} from '../../presence'
import {set} from '../patch'
import {BooleanInputProps} from '../types'

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

export function BooleanInput(props: BooleanInputProps) {
  const {onChange, value, type, inputProps, validation, presence} = props
  const {id, onFocus, readOnly, ref} = inputProps
  const layout = type.options?.layout || 'switch'

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
    <ChangeIndicator>
      <Card border radius={1}>
        <Flex>
          <ZeroLineHeightBox padding={3}>
            <LayoutSpecificInput
              checked={checked}
              disabled={readOnly}
              id={id}
              indeterminate={indeterminate}
              label={type.title}
              onChange={handleChange}
              onFocus={onFocus}
              readOnly={readOnly}
              ref={ref}
              style={{margin: -4}}
            />
          </ZeroLineHeightBox>
          <Box flex={1} paddingY={3}>
            <FormFieldHeaderText
              description={type.description}
              inputId={id}
              title={type.title}
              validation={validation}
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
}
