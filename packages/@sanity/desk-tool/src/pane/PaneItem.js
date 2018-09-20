import PropTypes from 'prop-types'
import React from 'react'
import schema from 'part:@sanity/base/schema'
import DocumentPaneItemPreview from '../components/DocumentPaneItemPreview'
import SimplePaneItemPreview from '../components/SimplePaneItemPreview'
import MissingSchemaType from '../components/MissingSchemaType'
import PaneItemWrapper from './PaneItemWrapper'

export default function PaneItem(props) {
  const {id, getLinkState, isSelected, schemaType, layout, icon, value} = props
  const useGrid = layout === 'card' || layout === 'media'

  const hasSchemaType = schemaType && schemaType.name && schema.get(schemaType.name)

  let preview
  if (value && value._id) {
    preview = hasSchemaType ? (
      <DocumentPaneItemPreview icon={icon} layout={layout} schemaType={schemaType} value={value} />
    ) : (
      <MissingSchemaType value={value} />
    )
  } else {
    preview = (
      <SimplePaneItemPreview
        icon={icon || (schemaType && schemaType.icon)}
        layout={layout}
        value={value}
      />
    )
  }

  return (
    <PaneItemWrapper
      linkState={getLinkState(id)}
      isSelected={isSelected}
      layout={layout}
      useGrid={useGrid}
    >
      {preview}
    </PaneItemWrapper>
  )
}

PaneItem.propTypes = {
  id: PropTypes.string.isRequired,
  getLinkState: PropTypes.func.isRequired,
  layout: PropTypes.string,
  isSelected: PropTypes.bool,
  icon: PropTypes.func,
  value: PropTypes.shape({
    _id: PropTypes.string,
    _type: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    media: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
  }),
  schemaType: PropTypes.shape({
    name: PropTypes.string,
    icon: PropTypes.func
  })
}

PaneItem.defaultProps = {
  layout: 'default',
  value: null,
  isSelected: false,
  schemaType: null
}
