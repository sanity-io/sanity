/* eslint-disable camelcase */

import React, {memo} from 'react'
import {Box, Flex} from '@sanity/ui'
import {FieldPresence} from '../../../presence'
import {NodePresence, NodeValidation} from '../../types'
import {FormFieldHeaderText} from './FormFieldHeaderText'

export interface FormFieldHeaderProps {
  /**
   * @alpha
   */
  validation?: NodeValidation[]
  /**
   * @alpha
   */
  __unstable_presence?: NodePresence[]
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: React.ReactNode
}

export const FormFieldHeader = memo(function FormFieldHeader(props: FormFieldHeaderProps) {
  const {validation, __unstable_presence: presence, description, inputId, title} = props

  return (
    <Flex align="flex-end">
      <Box flex={1} paddingY={2}>
        <FormFieldHeaderText
          validation={validation}
          description={description}
          inputId={inputId}
          title={title}
        />
      </Box>

      {presence && presence.length > 0 && (
        <Box>
          <FieldPresence maxAvatars={4} presence={presence} />
        </Box>
      )}
    </Flex>
  )
})
