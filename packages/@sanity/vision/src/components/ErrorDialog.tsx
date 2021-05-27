import React from 'react'

export interface ErrorDialogProps {
  heading?: string
  error: Error | string
}

function ErrorDialog(props: ErrorDialogProps) {
  const {error, heading = 'An error occured'} = props

  return (
    <div className="error">
      <h2>{heading}</h2>
      <pre>
        <code>{typeof error === 'string' ? error : error.message}</code>
      </pre>
    </div>
  )
}

export default ErrorDialog
