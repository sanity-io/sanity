import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultList from 'part:@sanity/components/lists/default'
import styles from './styles/ReferringDocumentsHelper.css'

import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'

function renderReferringDocumentItem(item, index, options) {
  const type = schema.get(item._type)
  const linkState = {
    selectedDocumentId: item._id,
    selectedType: type.name,
    action: 'edit'
  }
  return (
    <StateLinkListItem state={linkState}>
      <Preview value={item} type={type} />
    </StateLinkListItem>
  )
}

export default function ReferringDocumentsHelper(props) {
  const docCount = (props.documents.length > 100)
    ? '100+'
    : props.documents.length

  return (
    <FullscreenDialog isOpen title="Cannot delete document" onClose={props.onCancel}>
      <p>The following documents has references to this document that needs to be removed or replaced before it can be deleted.</p>
      <h3 className={styles.listHeadline}>{docCount} Referring documents</h3>
      <DefaultList overrideItemRender items={props.documents} renderItem={renderReferringDocumentItem} decoration="divider" />
    </FullscreenDialog>
  )
}

ReferringDocumentsHelper.propTypes = {
  onCancel: PropTypes.func.isRequired,
  documents: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string
  }))
}
