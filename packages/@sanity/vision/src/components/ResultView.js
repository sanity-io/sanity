import React from 'react'
import PropTypes from 'prop-types'
import ReactJsonView from 'react-json-view'
import {ReactJsonViewContainer} from './ResultView.styled'

function isJsonObject(data) {
  return data !== null && typeof data === 'object'
}

function ResultView(props) {
  const {data} = props

  return isJsonObject(data) ? (
    <ReactJsonViewContainer>
      <ReactJsonView
        name="result"
        src={data}
        displayDataTypes={false}
        collapsed={3}
        groupArraysAfterLength={50}
      />
    </ReactJsonViewContainer>
  ) : (
    <pre>{data === null ? 'null' : data.toString()}</pre>
  )
}

ResultView.propTypes = {
  data: PropTypes.any,
}

export default ResultView
