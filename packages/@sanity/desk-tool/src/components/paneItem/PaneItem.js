import PropTypes from 'prop-types'
import React, {useCallback, useContext} from 'react'
import {Card} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import folderIcon from 'part:@sanity/base/folder-icon'
import fileIcon from 'part:@sanity/base/file-icon'
import DocumentPaneItemPreview from '../../components/DocumentPaneItemPreview'
import getIconWithFallback from '../../utils/getIconWithFallback'
import MissingSchemaType from '../../components/MissingSchemaType'
// import PaneItemWrapper from './PaneItemWrapper'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'

export default function PaneItem(props) {
  const {id, isSelected, schemaType, layout, icon, value} = props
  // const useGrid = layout === 'card' || layout === 'media'
  const {ChildLink} = useContext(PaneRouterContext)
  const hasSchemaType = schemaType && schemaType.name && schema.get(schemaType.name)

  let preview
  if (value && value._id) {
    preview = hasSchemaType ? (
      <DocumentPaneItemPreview
        icon={getIconWithFallback(icon, schemaType, fileIcon)}
        layout={layout}
        schemaType={schemaType}
        value={value}
      />
    ) : (
      <MissingSchemaType value={value} />
    )
  } else {
    preview = (
      <SanityDefaultPreview
        icon={getIconWithFallback(icon, schemaType, folderIcon)}
        layout={layout}
        value={value}
      />
    )
  }

  const LinkComponent = useCallback(
    (linkProps) => {
      return <ChildLink {...linkProps} childId={id} />
    },
    [ChildLink, id]
  )

  // Todo: figure out what to do with useGrid and layout
  return (
    // <PaneItemWrapper id={id} isSelected={isSelected} layout={layout} useGrid={useGrid}>
    //   {preview}
    // </PaneItemWrapper>

    <Card padding={2} data-as="a" radius={3} selected={isSelected} as={LinkComponent}>
      {preview}
    </Card>
  )
}

PaneItem.propTypes = {
  id: PropTypes.string.isRequired,
  layout: PropTypes.string,
  isSelected: PropTypes.bool,
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  value: PropTypes.shape({
    _id: PropTypes.string,
    _type: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    media: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  }),
  schemaType: PropTypes.shape({
    name: PropTypes.string,
    icon: PropTypes.func,
  }),
}

PaneItem.defaultProps = {
  layout: 'default',
  icon: undefined,
  value: null,
  isSelected: false,
  schemaType: null,
}
