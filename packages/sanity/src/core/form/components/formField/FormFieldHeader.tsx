/* eslint-disable camelcase */

import React, {memo} from 'react'
import {Box, Flex} from '@sanity/ui'
import {FormNodeValidation} from '@sanity/types'
import styled from 'styled-components'
import {FieldPresence, FormNodePresence} from '../../../presence'
import {FormFieldHeaderText} from './FormFieldHeaderText'

export interface FormFieldHeaderProps {
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_actions?: React.ReactNode
  /**
   * @beta
   */
  validation?: FormNodeValidation[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: React.ReactNode
}

const Root = styled(Flex)({
  // This prevents the buttons from taking up extra vertical space in the flex layout,
  // due to their default vertical alignment being baseline.
  lineHeight: 1,
})

export const FormFieldHeader = memo(function FormFieldHeader(props: FormFieldHeaderProps) {
  const {
    __unstable_actions: actions,
    __unstable_presence: presence,
    description,
    inputId,
    title,
    validation,
  } = props

  return (
    <Root align="flex-end">
      <Box flex={1} paddingY={2}>
        <FormFieldHeaderText
          validation={validation}
          description={description}
          inputId={inputId}
          title={title}
        />
      </Box>

      {presence && presence.length > 0 && (
        <Box flex="none">
          <FieldPresence maxAvatars={4} presence={presence} />
        </Box>
      )}

      {actions && (
        <Box flex="none" marginLeft={3}>
          {actions}
        </Box>
      )}
    </Root>
  )
})
