import PropTypes from 'prop-types'
import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Button from 'part:@sanity/components/buttons/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import CorsCheck from './CorsCheck'

export default function ErrorDialog(props) {
  const isNetworkError = props.error.isNetworkError

  return (
    <FullscreenDialog color="danger" title="Error" isOpen centered>
      {!isNetworkError && <p>{props.error.message}</p>}
      {isNetworkError && (
        <DialogContent size="medium" padding="none">
          <p>An error occured while attempting to reach the Sanity API.</p>
          <CorsCheck />
        </DialogContent>
      )}

      <Button onClick={props.onRetry}>Retry</Button>
    </FullscreenDialog>
  )
}

ErrorDialog.propTypes = {
  error: PropTypes.shape({
    isNetworkError: PropTypes.bool,
    message: PropTypes.string.isRequired
  }).isRequired,
  onRetry: PropTypes.func.isRequired
}
