import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import schema from 'part:@sanity/base/schema'
import {StateLink} from 'part:@sanity/base/router'
import WarningIcon from 'part:@sanity/base/warning-icon'
import {Item as GridListItem} from 'part:@sanity/components/lists/grid'
import DocumentPreview, {SanityDefaultPreview} from 'part:@sanity/base/preview'
import listStyles from './styles/ListView.css'
import styles from './styles/PaneItem.css'

const getUnknownTypeFallback = (id, typeName) => ({
  title: <span style={{fontStyle: 'italic'}}>No schema found for type &quot;{typeName}&quot;</span>,
  subtitle: <span style={{fontStyle: 'italic'}}>Document: {id}</span>,
  media: WarningIcon
})

export default function PaneItem(props) {
  const {id, getLinkState, isSelected, schemaType, layout, status, value} = props
  const useGrid = layout === 'card' || layout === 'media'
  const hasSchemaType = schemaType && schemaType.name && schema.get(schemaType.name)
  const icon = hasSchemaType && schemaType.icon

  let content
  if (hasSchemaType && value && value._id) {
    content = <DocumentPreview value={value} layout={layout} type={schemaType} status={status} />
  } else if (value._id && !hasSchemaType) {
    content = (
      <SanityDefaultPreview
        value={getUnknownTypeFallback(value._id, value._type)}
        layout={layout}
        status={status}
      />
    )
  } else {
    content = <SanityDefaultPreview value={value} layout={layout} icon={icon} status={status} />
  }

  const link = (
    <StateLink state={getLinkState(id)} className={styles.link}>
      {content}
      <Ink duration={1000} opacity={0.1} radius={200} />
    </StateLink>
  )

  return useGrid ? (
    <GridListItem className={listStyles[`${layout}ListItem`]}>{link}</GridListItem>
  ) : (
    <div className={isSelected ? styles.selected : styles.item}>{link}</div>
  )
}

PaneItem.propTypes = {
  id: PropTypes.string.isRequired,
  getLinkState: PropTypes.func.isRequired,
  layout: PropTypes.string,
  isSelected: PropTypes.bool,
  status: PropTypes.func,
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
  status: undefined,
  isSelected: false,
  schemaType: null
}
