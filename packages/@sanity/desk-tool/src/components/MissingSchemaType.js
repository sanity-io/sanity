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
