import React from 'react'

export interface NoResultsDialogProps {
  dataset: string
  query: string
}

function NoResultsDialog(props: NoResultsDialogProps) {
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

export default NoResultsDialog
