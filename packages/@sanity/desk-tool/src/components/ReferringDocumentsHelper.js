import React, {PropTypes} from 'react'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import ReferringDocumentItem from './ReferringDocumentItem'

function ReferringDocumentsHelper(props) {
  let docCount = props.documents.length
  if (docCount === 100) {
    docCount = `${docCount}+`
  }

  return (
    <FullscreenDialog isOpen kind="danger" title="Cannot delete" onClose={props.onCancel}>
      <p>The following {docCount} documents has references to this document that needs to be removed or replaced before it can be deleted:</p>

      <ul>
        {props.documents.map(doc =>
          <ReferringDocumentItem
            key={doc._id}
            document={doc}
          />
        )}
      </ul>
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
