/* eslint-disable import/no-unresolved */

import React, {useCallback} from 'react'
import styled from 'styled-components'
import {useId} from '@reach/auto-id'
import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import {BooleanSchemaType} from '@sanity/types'
import {FormFieldHeaderText} from '@sanity/base/components'
import {FieldStatus} from '@sanity/base/_internal'
import {ChangeIndicator} from '@sanity/base/change-indicators'
import {FieldPresence} from '@sanity/base/presence'
import PatchEvent, {set} from '../PatchEvent'
import {Props} from './types'

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

const BooleanInput = React.forwardRef(function BooleanInput(
  props: Props<boolean, BooleanSchemaType>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {onChange} = props
  const {value, type, readOnly, onFocus, markers, presence} = props
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
              __unstable_markers={markers}
              title={type.title}
            />
          </Box>
          <CenterAlignedBox paddingX={3} paddingY={1}>
            <FieldStatus maxAvatars={1} position="top">
              <FieldPresence maxAvatars={1} presence={presence} />
            </FieldStatus>
          </CenterAlignedBox>
        </Flex>
      </Card>
    </ChangeIndicator>
  )
})
export default BooleanInput
