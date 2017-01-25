import React, {PropTypes} from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultList from 'part:@sanity/components/lists/default'
import ReferringDocumentItem from './ReferringDocumentItem'
import styles from './styles/ReferringDocumentsHelper.css'

function ReferringDocumentsHelper(props) {
  let docCount = props.documents.length
  if (docCount === 100) {
    docCount = `${docCount}+`
  }

  const renderItem = ReferringDocumentItem
  const items = props.documents
  const docTitle = 'document'

  return (
    <FullscreenDialog isOpen title={`Cannot delete ${docTitle}`} onClose={props.onCancel}>
      <p>The following documents has references to this document that needs to be removed or replaced before it can be deleted.</p>

      <h3 className={styles.listHeadline}>{docCount} Reffering documents</h3>
      <DefaultList items={items} renderItem={renderItem} decoration="divider" />

    </FullscreenDialog>
  )
}

ReferringDocumentsHelper.propTypes = {
  onCancel: PropTypes.func.isRequired,
  documents: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string
  }))
}

export default ReferringDocumentsHelper
