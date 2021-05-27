import React from 'react'
import {VisionError} from '../types'
import QueryErrorDetails from './QueryErrorDetails'

function QueryErrorDialog(props: {error: VisionError}) {
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

export default QueryErrorDialog
