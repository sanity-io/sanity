import React from 'react'
import PropTypes from 'prop-types'

function NoResultsDialog(props) {
  return (
    <div className="vision_no-results">
      <h2>No matches</h2>
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
  dataset: PropTypes.string.isRequired
}

export default NoResultsDialog
