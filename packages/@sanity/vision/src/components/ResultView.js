import React from 'react'
import PropTypes from 'prop-types'
import ReactJsonView from 'react-json-view'

function isJSONValue(data) {
  return data !== null && typeof data === 'object'
}

function ResultView(props) {
  const {data} = props

  return isJSONValue(data) ? (
    <ReactJsonView
      name="result"
      src={data}
      displayDataTypes={false}
      collapsed={3}
      groupArraysAfterLength={50}
    />
  ) : (
    <pre>{data || 'null'}</pre>
  )
}

ResultView.propTypes = {
  data: PropTypes.any,
}

export default ResultView
