/* eslint-disable complexity */

import PropTypes from 'prop-types'
import React from 'react'
import WarningIcon from 'part:@sanity/base/warning-icon'
import Alert from 'part:@sanity/components/alerts/alert'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'
import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import DocTitle from './DocTitle'
import ReferringDocumentsList from './ReferringDocumentsList'

import styles from './ConfirmDelete.css'

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
      const {isCheckingReferringDocuments, referringDocuments, draft, published} = this.props

      const hasReferringDocuments = referringDocuments.length > 0

      const canContinue = !isCheckingReferringDocuments

      const actions = [
        canContinue && {
          name: 'confirm',
          title: hasReferringDocuments ? 'Try to delete anyway' : 'Delete now',
          color: 'danger'
        },
        {name: 'cancel', title: 'Cancel', inverted: true}
      ].filter(Boolean)

      const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm delete'

      const docTitle = <DocTitle document={draft || published} />

      return (
        <FullscreenDialog
          cardClassName={styles.card}
          isOpen
          showHeader
          color="danger"
          centered
          title={title}
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
                that refer{referringDocuments.length === 1 ? <>s</> : ''} to “{docTitle}”.
              </Alert>

              <p>
                You may not be able to delete “{docTitle}” because{' '}
                {referringDocuments.length === 1 ? <>this document</> : <>these documents</>} refer
                {referringDocuments.length === 1 ? <>s</> : ''} to it:
              </p>

              <ReferringDocumentsList documents={referringDocuments} />
            </>
          )}
          {!isCheckingReferringDocuments && !hasReferringDocuments && (
            <>
              <p>
                Are you sure you want to delete <strong>“{docTitle}”</strong>?
              </p>
            </>
          )}
        </FullscreenDialog>
      )
    }
  }
)
