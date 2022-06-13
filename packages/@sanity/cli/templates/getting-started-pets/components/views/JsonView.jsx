import React from 'react'
import {Flex} from "@sanity/ui";
import PropTypes from 'prop-types';

/**
 * Simply displays the currently displayed document as formatted JSON
 */
export function JsonView(props) {
  const doc = props.document.displayed;
  return <Flex padding={4}>
    <pre>
      {JSON.stringify(doc, null, 2)}
    </pre>
  </Flex>
}

JsonView.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object
  }),
};