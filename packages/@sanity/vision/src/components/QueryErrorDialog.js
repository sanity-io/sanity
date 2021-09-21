import React from 'react'
import PropTypes from 'prop-types'
import {Box, Stack} from '@sanity/ui'
import QueryErrorDetails from './QueryErrorDetails'
import {ErrorCode} from './QueryErrorDialog.styled'

function QueryErrorDialog(props) {
  return (
    <Box className="vision_query-error">
      <Stack space={5} marginTop={2}>
        <ErrorCode size={1}>{props.error.message}</ErrorCode>
        <QueryErrorDetails error={props.error} />
      </Stack>
    </Box>
  )
}

QueryErrorDialog.propTypes = {
  error: PropTypes.instanceOf(Error),
}

export default QueryErrorDialog
