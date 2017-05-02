import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultList from 'part:@sanity/components/lists/default'
import styles from './styles/ReferringDocumentsHelper.css'
import renderReferringDocumentItem from './renderReferringDocumentItem'

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
