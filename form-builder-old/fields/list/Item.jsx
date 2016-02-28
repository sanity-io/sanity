import React from 'react'

export default React.createClass({
  displayName: 'Item',
  propTypes: {
    item: React.PropTypes.any.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired,
    fieldBuilders: React.PropTypes.object.isRequired,
    type: React.PropTypes.string.isRequired
  },
  render() {
    const {item, fieldPreviews, type, schema} = this.props
    const FieldPreview = fieldPreviews[type] || fieldPreviews.default
    const attributes = schema[type] ? schema[type].attributes : []
    // Note: fieldPreviews are only needed by the Reference fieldPreview
    // Attributes are needed to get various info like values/texts needed for the preview.
    return <FieldPreview value={item} attributes={attributes} fieldPreviews={fieldPreviews}/>
  }
})
