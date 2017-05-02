import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'

import DefaultList from 'part:@sanity/components/lists/default'
import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import renderReferringDocument from './renderReferringDocument'

export default enhanceWithReferringDocuments(class ConfirmDelete extends React.PureComponent {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    published: PropTypes.object,
    draft: PropTypes.object,
    referringDocuments: PropTypes.array,
    isCheckingReferringDocuments: PropTypes.bool
  }

  handleAction = action => {
    const {onCancel, onConfirm} = this.props
    if (action.name === 'confirm') {
      onConfirm()
    }
    if (action.name === 'cancel') {
      onCancel()
    }
  }


  render() {
    const {isCheckingReferringDocuments, referringDocuments, draft, published, onCancel} = this.props
    const title = (draft || published).title // todo

    const hasReferringDocuments = referringDocuments.length > 0
    const actions = [
      !isCheckingReferringDocuments && {name: 'confirm', title: 'Delete now', disabled: hasReferringDocuments},
      {name: 'cancel', title: hasReferringDocuments ? 'Close' : 'Cancel', kind: 'secondary'}
    ].filter(Boolean)

    return (
      <Dialog
        isOpen
        showHeader
        color="danger"
        centered
        title={hasReferringDocuments ? 'Cannot delete document' : 'Confirm delete document'}
        onClose={onCancel}
        onAction={this.handleAction}
        actions={actions}
      >
        {isCheckingReferringDocuments && <Spinner message="Looking for referring documents…" /> }
        {hasReferringDocuments && (
          <div>
            <p>
              The following documents has references to this document that needs to be removed or replaced before it
              can be deleted.
            </p>
            <h3>{referringDocuments.length} Referring documents</h3>
            <DefaultList
              overrideItemRender
              items={referringDocuments}
              renderItem={renderReferringDocument}
              decoration="divider"
            />
          </div>
        )}
        {!isCheckingReferringDocuments && !hasReferringDocuments && (
          <div style={{padding: 10}}>
            <p>
              Are you sure you would like to delete the document <strong>{title}</strong>?
            </p>
            <h2>Warning!</h2>
            <p>
              If you continue, this document will not be available to anyone anymore.
            </p>
          </div>
        )}
      </Dialog>
    )
  }
})
