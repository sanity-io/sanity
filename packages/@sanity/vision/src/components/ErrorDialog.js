import React from 'react'
import PropTypes from 'prop-types'

function ErrorDialog(props) {
  return (
    <div className="error">
      <h2>{props.heading}</h2>
      <pre>
        <code>{props.error.message || props.error}</code>
      </pre>
    </div>
  )
}

ErrorDialog.propTypes = {
  heading: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string]).isRequired
}

ErrorDialog.defaultProps = {
  heading: 'An error occured'
}

export default ErrorDialog
