/* eslint-disable camelcase */

import {ValidationMarker} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {useFormNode} from '../formNode'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'

export function FormFieldHeaderText(props: {
  /**
   * @internal
   */
  __internal_description?: React.ReactNode

  /**
   * @internal
   */
  __internal_title?: React.ReactNode

  /**
   * @internal
   */
  __internal_validation?: ValidationMarker[]
}) {
  const {inputId, type, validation: validationContext} = useFormNode()
  const {
    __internal_description: description = type.description,
    __internal_title: title = type.title,
    __internal_validation: validation = validationContext,
  } = props

  const hasValidations = validation.length > 0

  return (
    <Stack space={2}>
      <Flex>
        <Text as="label" htmlFor={inputId} weight="semibold" size={1}>
          {title || <em>Untitled</em>}
        </Text>

        {hasValidations && (
          <Box marginLeft={2}>
            <FormFieldValidationStatus fontSize={1} />
          </Box>
        )}
      </Flex>

      {description && (
        <Text muted size={1}>
          {description}
        </Text>
      )}
    </Stack>
  )
}
