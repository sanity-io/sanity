import React from 'react'
import PropTypes from 'prop-types'

function QueryErrorDetails(props) {
  const details = props.error.details
  if (!details || !details.line) {
    return null
  }

  return (
    <div>
      <pre>
        <code>{`${details.line}\n${dashLine(details.column)}`}</code>
      </pre>
      <pre>
        <code>{`Line:   ${details.lineNumber}\nColumn: ${details.column}`}</code>
      </pre>
    </div>
  )
}

function dashLine(ln) {
  const line = new Array(ln + 1).join('-')
  return `${line}^`
}

QueryErrorDetails.propTypes = {
  error: PropTypes.shape({
    details: PropTypes.shape({
      line: PropTypes.string,
      lineNumber: PropTypes.number,
      column: PropTypes.column,
    }),
  }),
}

export default QueryErrorDetails
