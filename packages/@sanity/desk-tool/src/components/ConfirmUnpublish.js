import PropTypes from 'prop-types'
import React from 'react'
import WarningIcon from 'part:@sanity/base/warning-icon'
import Alert from 'part:@sanity/components/alerts/alert'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'

import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import DocTitle from './DocTitle'
import ReferringDocumentsList from './ReferringDocumentsList'

import styles from './ConfirmUnpublish.css'

export default enhanceWithReferringDocuments(
  class ConfirmUnpublish extends React.PureComponent {
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

    // eslint-disable-next-line complexity
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
          color: 'danger',
          name: 'confirm',
          title: hasReferringDocuments ? 'Try to unpublish anyway' : 'Unpublish now'
        },
        {
          inverted: true,
          name: 'cancel',
          title: 'Cancel'
        }
      ].filter(Boolean)

      const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm unpublish'

      const docTitle = <DocTitle document={draft || published} />

      return (
        <FullscreenDialog
          cardClassName={styles.card}
          isOpen
          showHeader
          centered
          title={title}
          onClose={onCancel}
          onAction={this.handleAction}
          actions={actions}
        >
          {isCheckingReferringDocuments && <Spinner message="Looking for referring documents…" />}

          {hasReferringDocuments && (
            <>
              <Alert color="warning" icon={WarningIcon}>
                Warning: Found{' '}
                {referringDocuments.length === 1 ? (
                  <>a document</>
                ) : (
                  <>{referringDocuments.length} documents</>
                )}{' '}
                that refers to “{docTitle}”
              </Alert>

              <p>
                You may not be able to unpublish “{docTitle}” because the following document
                {referringDocuments.length !== 1 && <>s</>} refers to it:
              </p>
              <ReferringDocumentsList documents={referringDocuments} />
            </>
          )}

          {!isCheckingReferringDocuments && !hasReferringDocuments && (
            <>
              <Alert color="warning" icon={WarningIcon} title="Careful!">
                If you unpublish this document, it will no longer be available for the public.
                However, it will not be deleted and can be published again later.
              </Alert>

              <p>
                Are you sure you want to unpublish the document <strong>“{docTitle}”</strong>?
              </p>
            </>
          )}
        </FullscreenDialog>
      )
    }
  }
)
