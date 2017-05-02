import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'

const ACTION_CANCEL = {name: 'cancel', title: 'Cancel', kind: 'secondary'}

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
      !isCheckingReferringDocuments && {name: 'confirm', color: 'danger', title: 'Unpublish now', disabled: hasReferringDocuments},
      {name: 'cancel', title: hasReferringDocuments ? 'Close' : 'Cancel', kind: 'secondary'}
    ].filter(Boolean)

    return (
      <Dialog
        isOpen
        showHeader
        centered
        title={hasReferringDocuments ? 'Cannot unpublish document' : 'Confirm unpublish document'}
        onClose={onCancel}
        onAction={this.handleAction}
        actions={actions}
      >
        {isCheckingReferringDocuments && <Spinner message="Looking for referring documents…" /> }
        {hasReferringDocuments && (
          <div>
            <p>
              The following documents has references to this document that needs to be removed or replaced before it
              can be unpublished.
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
              Are you sure you would like to unpublish the document <strong>{title}</strong>?
            </p>
            <p>
              It will no longer be available for the public, but it will not be deleted and can be published again later if you change your mind.
            </p>
          </div>
        )}
      </Dialog>
    )
  }
})
