import React, {forwardRef, useContext, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Card, Text} from '@sanity/ui'
import {ChevronRightIcon} from '@sanity/icons'
import schema from 'part:@sanity/base/schema'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import folderIcon from 'part:@sanity/base/folder-icon'
import fileIcon from 'part:@sanity/base/file-icon'
import DocumentPaneItemPreview from '../../components/DocumentPaneItemPreview'
import getIconWithFallback from '../../utils/getIconWithFallback'
import MissingSchemaType from '../../components/MissingSchemaType'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'

PaneItem.propTypes = {
  id: PropTypes.string.isRequired,
  layout: PropTypes.string,
  isSelected: PropTypes.bool,
  isActive: PropTypes.bool,
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
  isActive: false,
  schemaType: null,
}

export default function PaneItem(props) {
  const {id, isSelected, schemaType, layout, icon, value, isActive} = props
  const {ChildLink} = useContext(PaneRouterContext)
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))

  const preview = useMemo(() => {
    if (value && value._id) {
      if (!hasSchemaType) {
        return <MissingSchemaType value={value} />
      }

      return (
        <DocumentPaneItemPreview
          icon={getIconWithFallback(icon, schemaType, fileIcon)}
          layout={layout}
          schemaType={schemaType}
          value={value}
        />
      )
    }

    return (
      <SanityDefaultPreview
        status={
          <Text muted size={1}>
            <ChevronRightIcon />
          </Text>
        }
        icon={getIconWithFallback(icon, schemaType, folderIcon)}
        layout={layout}
        value={value}
      />
    )
  }, [hasSchemaType, icon, layout, schemaType, value])

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
      forwardRef(function LinkComponent(linkProps, ref) {
        return <ChildLink {...linkProps} childId={id} ref={ref} />
      }),
    [ChildLink, id]
  )

  return useMemo(
    () => (
      <Card
        __unstable_focusRing
        as={LinkComponent}
        data-as="a"
        data-ui="PaneItem"
        padding={2}
        radius={2}
        pressed={!isActive && isSelected}
        selected={isActive && isSelected}
      >
        {preview}
      </Card>
    ),
    [isActive, isSelected, LinkComponent, preview]
  )
}
