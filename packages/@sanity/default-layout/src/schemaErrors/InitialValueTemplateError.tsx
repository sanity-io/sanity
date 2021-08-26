import PropTypes from 'prop-types'
import React from 'react'
import {Box, Dialog, Stack, Text} from '@sanity/ui'

export default function InitialValueTemplateError({errors}) {
  return (
    <Dialog header="Initial value template error" id="initial-value-error-dialog" width={1}>
      <Box padding={4}>
        <Stack space={4}>
          <Text>Failed to load initial value templates:</Text>
          {errors.map((error: Error) => (
            <Text key={error.message}>
              <code>{error.message}</code>
            </Text>
          ))}
        </Stack>
      </Box>
    </Dialog>
  )
}

InitialValueTemplateError.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
    })
  ).isRequired,
}
