/* eslint-disable camelcase */

import {Box, Flex, Stack, Text} from '@sanity/ui'
import React, {memo} from 'react'

export interface FormFieldHeaderTextProps {
  validation?: React.ReactNode
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: React.ReactNode
}

export const FormFieldHeaderText = memo(function FormFieldHeaderText(
  props: FormFieldHeaderTextProps
) {
  const {description, inputId, title, validation} = props

  return (
    <Stack space={2}>
      <Flex>
        <Text as="label" htmlFor={inputId} weight="semibold" size={1}>
          {title || <em>Untitled</em>}
        </Text>

        {validation && <Box marginLeft={2}>{validation}</Box>}
      </Flex>

      {description && (
        <Text muted size={1}>
          {description}
        </Text>
      )}
    </Stack>
  )
})
