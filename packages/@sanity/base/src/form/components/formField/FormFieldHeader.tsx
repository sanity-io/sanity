/* eslint-disable camelcase */

import {ValidationMarker} from '@sanity/types'
import {Box, Flex} from '@sanity/ui'
import React, {memo} from 'react'
import {useFormNode} from '../formNode'
import {FieldPresence} from '../../../presence'
import {FormFieldHeaderText} from './FormFieldHeaderText'

export const FormFieldHeader = memo(function FormFieldHeader(props: {
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
  const {presence, validation: validationContext} = useFormNode()
  const {
    __internal_description: description,
    __internal_title: title,
    __internal_validation: validation = validationContext,
  } = props

  return (
    <Flex align="flex-end">
      <Box flex={1} paddingY={2}>
        <FormFieldHeaderText
          __internal_description={description}
          __internal_title={title}
          __internal_validation={validation}
        />
      </Box>

      {presence && presence.length > 0 && (
        <Box>
          <FieldPresence maxAvatars={4} />
        </Box>
      )}
    </Flex>
  )
})
