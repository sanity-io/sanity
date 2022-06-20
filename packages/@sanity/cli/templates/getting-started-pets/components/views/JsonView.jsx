import React from 'react'
import {Flex, Code} from '@sanity/ui'
import PropTypes from 'prop-types'

/**
 * Displays the currently displayed document as formatted JSON (second tab next to preview)
 */
export function JsonView(props) {
  const doc = props.document.displayed
  return (
    <Flex padding={4}>
      <Code>{JSON.stringify(doc, null, 2)}</Code>
    </Flex>
  )
}

JsonView.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}
