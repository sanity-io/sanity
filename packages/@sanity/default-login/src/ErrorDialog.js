import PropTypes from 'prop-types'
import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Button from 'part:@sanity/components/buttons/default'
import CorsCheck from './CorsCheck'

export default function ErrorDialog(props) {
  const isNetworkError = props.error.isNetworkError

  return (
    <FullscreenDialog color="danger" title="Error" isOpen centered>
      {!isNetworkError && <p>{props.error.message}</p>}
      {isNetworkError && (
        <div>
          <p>An error occured while attempting to reach the Sanity API.</p>
          <CorsCheck />
        </div>
      )}

      <Button onClick={props.onRetry}>Retry</Button>
    </FullscreenDialog>
  )
}

ErrorDialog.defaultProps = {
  isNetworkError: false
}

ErrorDialog.propTypes = {
  error: PropTypes.shape({
    isNetworkError: PropTypes.boolean,
    message: PropTypes.string.isRequired
  }).isRequired,
  onRetry: PropTypes.func.isRequired
}
