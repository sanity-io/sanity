import React from 'react'
import ReactJsonView from 'react-json-view'

export interface ResultViewProps {
  data?: any
}

function isJsonObject(data: unknown): data is Record<string, unknown> {
  return Boolean(data) && typeof data === 'object'
}

function ResultView(props: ResultViewProps) {
  const {data} = props

  return isJsonObject(data) ? (
    <ReactJsonView
      name="result"
      src={data}
      displayDataTypes={false}
      collapsed={3}
      groupArraysAfterLength={50}
    />
  ) : (
    <pre>{JSON.stringify(data)}</pre>
  )
}

export default ResultView
