import PropTypes from 'prop-types'
import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DialogContent from 'part:@sanity/components/dialogs/content'

export default function InitialValueTemplateError({errors}) {
  return (
    <FullscreenDialog color="danger" title="Initial value template error" isOpen centered>
      {
        <DialogContent size="medium" padding="none">
          <p>Failed to load initial value templates:</p>
          {errors.map((error, i) => (
            <p key={error.message}>
              <code>{error.message}</code>
            </p>
          ))}
        </DialogContent>
      }
    </FullscreenDialog>
  )
}

InitialValueTemplateError.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired
    })
  ).isRequired
}
