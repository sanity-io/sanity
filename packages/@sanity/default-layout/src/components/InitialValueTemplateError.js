import PropTypes from 'prop-types'
import React from 'react'
import FullscreenMessageDialog from 'part:@sanity/components/dialogs/fullscreen-message'

export default function InitialValueTemplateError({errors}) {
  return (
    <FullscreenMessageDialog color="danger" title="Initial value template error">
      <p>Failed to load initial value templates:</p>
      {errors.map((error, i) => (
        <p key={error.message}>
          <code>{error.message}</code>
        </p>
      ))}
    </FullscreenMessageDialog>
  )
}

InitialValueTemplateError.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired
    })
  ).isRequired
}
