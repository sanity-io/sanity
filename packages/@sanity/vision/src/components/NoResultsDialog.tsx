import React from 'react'
import PropTypes from 'prop-types'

function NoResultsDialog(props) {
  return (
    <div className="vision_no-results">
      <h1>No matches</h1>
      <p>
        No documents found in dataset <code>{props.dataset}</code> that match query:
      </p>
      <pre>
        <code>{props.query}</code>
      </pre>
    </div>
  )
}

NoResultsDialog.propTypes = {
  query: PropTypes.string.isRequired,
  dataset: PropTypes.string.isRequired,
}

export default NoResultsDialog
