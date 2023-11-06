import {Box} from '@sanity/ui'
import React, {useMemo} from 'react'
import {ValueError} from '../diff/components/ValueError'
import type {FieldValueError} from '../validation'

export default function ValueErrorStory() {
  const error: FieldValueError = useMemo(
    () => ({
      value: 123,
      actualType: 'number',
      expectedType: 'string',
      messageKey: 'changes.error.incorrect-type-message',
    }),
    [],
  )

  return (
    <Box padding={4}>
      <ValueError error={error} />
    </Box>
  )
}
