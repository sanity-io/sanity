/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/prefer-stateless-function */
/* eslint-disable react/require-optimization */

import React from 'react'
import PropTypes from 'prop-types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import WarningIcon from 'part:@sanity/base/warning-icon'

const getUnknownTypeFallback = (id, typeName) => ({
  title: (
    <span style={{fontStyle: 'italic'}}>
      No schema found for type &quot;
      {typeName}
      &quot;
    </span>
  ),
  subtitle: <span style={{fontStyle: 'italic'}}>Document: {id}</span>,
  media: WarningIcon
})

export default class MissingSchemaType extends React.Component {
  render() {
    const {layout, value} = this.props
    return (
      <SanityDefaultPreview
        value={getUnknownTypeFallback(value._id, value._type)}
        layout={layout}
      />
    )
  }
}
MissingSchemaType.propTypes = {
  layout: PropTypes.string,
  value: PropTypes.object
}
