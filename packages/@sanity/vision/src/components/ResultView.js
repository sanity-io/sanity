import React from 'react'
import PropTypes from 'prop-types'
import ResultCollection from './ResultCollection'
import JsonDump from './JsonDump'

const dumpableTypes = ['string', 'number', 'boolean']

function ResultView(props) {
  const {data, viewMode} = props

  const isDumpable = data === null || dumpableTypes.includes(typeof data)
  return isDumpable ? (
    <JsonDump data={data} />
  ) : (
    <ResultCollection data={data} viewMode={viewMode} />
  )
}

ResultView.propTypes = {
  data: PropTypes.any,
  viewMode: PropTypes.oneOf(['inspector', 'dump'])
}

ResultView.defaultProps = {
  viewMode: 'dump'
}

export default ResultView
