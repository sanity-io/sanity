import React from 'react'
import {Stack} from '@sanity/ui'
import {QueryErrorDetails} from './QueryErrorDetails'
import {ErrorCode} from './QueryErrorDialog.styled'

export function QueryErrorDialog(props: {error: Error}) {
  return (
    <Stack space={5} marginTop={2}>
      <ErrorCode size={1}>{props.error.message}</ErrorCode>
      <QueryErrorDetails error={props.error} />
    </Stack>
  )
}
