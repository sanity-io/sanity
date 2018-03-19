import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'

import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import DocTitle from './DocTitle'
import ReferringDocumentsList from './ReferringDocumentsList'

export default enhanceWithReferringDocuments(
  class ConfirmDelete extends React.PureComponent {
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
      const {
        isCheckingReferringDocuments,
        referringDocuments,
        draft,
        published,
        onCancel
      } = this.props

      const hasReferringDocuments = referringDocuments.length > 0

      const canContinue = !isCheckingReferringDocuments

      const actions = [
        canContinue && {
          name: 'confirm',
          title: hasReferringDocuments ? 'Try to delete anyway' : 'Delete now'
        },
        {name: 'cancel', title: 'Cancel', kind: 'simple'}
      ].filter(Boolean)

      const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm delete'

      return (
        <Dialog
          isOpen
          showHeader
          color="danger"
          centered
          title={title}
          onClose={onCancel}
          onAction={this.handleAction}
          actions={actions}
        >
          {isCheckingReferringDocuments && <Spinner message="Looking for referring documents…" />}
          {hasReferringDocuments && (
            <div>
              <h3>
                Warning: Found{' '}
                {referringDocuments.length === 1
                  ? 'a document'
                  : `${referringDocuments.length} documents`}{' '}
                that refers to {'"'}
                <DocTitle document={draft || published} />
                {'"'}
              </h3>
              <p>
                You may not be allowed to delete
                {' "'}
                <DocTitle document={draft || published} />
                {'" '}
                as the following document{referringDocuments.length === 1 ? '' : 's'} refers to it:
              </p>
              <ReferringDocumentsList documents={referringDocuments} />
            </div>
          )}
          {!isCheckingReferringDocuments &&
            !hasReferringDocuments && (
              <div style={{padding: 10}}>
                <p>
                  Are you sure you would like to delete the document{' '}
                  <strong>
                    <DocTitle document={draft || published} />
                  </strong>?
                </p>
                <h2>Careful!</h2>
                <p>
                  If you continue, this document will be permanently gone and not be available to
                  anyone anymore.
                </p>
              </div>
            )}
        </Dialog>
      )
    }
  }
)
