import React from 'react'
import PropTypes from 'prop-types'
import QueryErrorDetails from './QueryErrorDetails'

function QueryErrorDialog(props) {
  return (
    <div className="vision_query-error">
      <h2>Query error</h2>
      <pre>
        <code>{props.error.message}</code>
      </pre>
      <QueryErrorDetails error={props.error} />
    </div>
  )
}

QueryErrorDialog.propTypes = {
  error: PropTypes.instanceOf(Error)
}

export default QueryErrorDialog
