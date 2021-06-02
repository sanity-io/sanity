import {Code, Heading} from '@sanity/ui'
import React from 'react'

export interface ErrorDialogProps {
  heading?: string
  error: Error | string
}

export function ErrorDialog(props: ErrorDialogProps) {
  const {error, heading = 'An error occured'} = props

  return (
    <div className="error">
      <Heading as="h2">{heading}</Heading>
      <Code>{typeof error === 'string' ? error : error.message}</Code>
    </div>
  )
}
