/* eslint-disable camelcase */

import React, {memo, ReactNode} from 'react'
import {Box, Flex} from '@sanity/ui'
import {FormFieldHeaderText} from './FormFieldHeaderText'

export interface FormFieldHeaderProps {
  validation?: ReactNode
  presence?: ReactNode
  description?: ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: React.ReactNode
}

export const FormFieldHeader = memo(function FormFieldHeader(props: FormFieldHeaderProps) {
  const {validation, presence, description, inputId, title} = props

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

      {presence && <Box>{presence}</Box>}
    </Flex>
  )
})
