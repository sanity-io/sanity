import PropTypes from 'prop-types'
import React from 'react'
import {Dialog as UIDialog, Box, Text, Button, Stack} from '@sanity/ui'
import styled from 'styled-components'
import CorsCheck from './CorsCheck'

const Dialog = styled(UIDialog)`
  /* @todo: Temp solution. Update sanity/ui with option to hide close button */
  [aria-label='Close dialog'] {
    display: none;
  }
`
export default function ErrorDialog(props) {
  const isNetworkError = props.error.isNetworkError

  return (
    <Dialog
      header="Error"
      cardShadow={2}
      width={1}
      footer={
        <Box padding={3}>
          <Button text="Retry" onClick={props.onRetry} style={{width: '100%'}} />
        </Box>
      }
    >
      <Box padding={4}>
        {!isNetworkError && <Text accent>{props.error.message}</Text>}
        {isNetworkError && (
          <Stack space={4}>
            <Text accent>An error occurred while attempting to reach the Sanity API.</Text>
            <CorsCheck />
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}

ErrorDialog.propTypes = {
  error: PropTypes.shape({
    isNetworkError: PropTypes.bool,
    message: PropTypes.string.isRequired,
  }).isRequired,
  onRetry: PropTypes.func.isRequired,
}
