import PropTypes from 'prop-types'
import React from 'react'
import FullscreenMessageDialog from 'part:@sanity/components/dialogs/fullscreen-message'
import Button from 'part:@sanity/components/buttons/default'
import CorsCheck from './CorsCheck'

export default function ErrorDialog(props) {
  const isNetworkError = props.error.isNetworkError

  return (
    <FullscreenMessageDialog
      buttons={<Button onClick={props.onRetry}>Retry</Button>}
      color="danger"
      title="Error"
      isOpen
      centered
    >
      {!isNetworkError && <p>{props.error.message}</p>}
      {isNetworkError && (
        <>
          <p>An error occured while attempting to reach the Sanity API.</p>
          <CorsCheck />
        </>
      )}
    </FullscreenMessageDialog>
  )
}

ErrorDialog.propTypes = {
  error: PropTypes.shape({
    isNetworkError: PropTypes.bool,
    message: PropTypes.string.isRequired
  }).isRequired,
  onRetry: PropTypes.func.isRequired
}
