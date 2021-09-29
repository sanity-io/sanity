import React from 'react'
import PropTypes from 'prop-types'
import {Box, Code, Text, Stack} from '@sanity/ui'

function NoResultsDialog(props) {
  return (
    <Box paddingY={2} className="vision_no-results">
      <Stack space={5}>
        <Text as="p" muted>
          No documents found in dataset <code>{props.dataset}</code> that match query:
        </Text>
        <Code>{props.query}</Code>
      </Stack>
    </Box>
  )
}

NoResultsDialog.propTypes = {
  query: PropTypes.string.isRequired,
  dataset: PropTypes.string.isRequired,
}

export default NoResultsDialog
