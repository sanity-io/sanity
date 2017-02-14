/* eslint-disable react/no-multi-comp */
import React, {PropTypes} from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultList from 'part:@sanity/components/lists/default'
import styles from './styles/ReferringDocumentsHelper.css'

import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'
import UrlDocId from '../utils/UrlDocId'


function renderReferringDocumentItem(item, index, options) {
  const docUrlId = UrlDocId.encode(item._id)
  const typeName = item._type.split('.').slice(1).join('.')
  const type = schema.get(typeName)
  const linkState = {
    selectedType: typeName,
    action: 'edit',
    selectedDocumentId: docUrlId
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
