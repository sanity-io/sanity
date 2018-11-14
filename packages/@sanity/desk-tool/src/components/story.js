/* eslint-disable complexity */
import React, {Fragment} from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import {withKnobs, boolean, number, text} from 'part:@sanity/storybook/addons/knobs'
import {range} from 'lodash'

storiesOf('[tool] Desk tool')
  .addDecorator(withKnobs)
  .add('Confirm Delete', () => {
    const hasReferringDocuments = boolean('hasReferringDocuments', false)
    const isCheckingReferringDocuments = boolean('isCheckingReferringDocuments', false)
    const canContinue = boolean('canContinue', false)
    const referringDocuments = range(number('referringDocuments', 1))
    const actions = [
      canContinue && {
        name: 'confirm',
        title: hasReferringDocuments ? 'Try to delete anyway' : 'Delete now',
        color: 'danger'
      },
      {name: 'cancel', title: 'Keep', kind: 'simple'}
    ].filter(Boolean)
    const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm delete'

    return (
      <Dialog
        isOpen
        showHeader
        color="danger"
        centered
        title={title}
        onAction={() => console.log('onAction')}
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
              Document title
              {'"'}
            </h3>
            <p>
              You may not be allowed to delete
              {' "'}
              Document title
              {'" '}
              as the following document{referringDocuments.length === 1 ? '' : 's'} refers to it:
            </p>
            List of documents
          </div>
        )}
        {!isCheckingReferringDocuments &&
          !hasReferringDocuments && (
            <Fragment>
              <h3>
                Are you sure you would like to permanently delete the document
                <strong>&nbsp;&ldquo;Test document&rdquo;</strong>?
              </h3>
            </Fragment>
          )}
      </Dialog>
    )
  })
  .add('Confirm unpublish', () => {
    const hasReferringDocuments = boolean('hasReferringDocuments', false)
    const isCheckingReferringDocuments = boolean('isCheckingReferringDocuments', false)
    const canContinue = boolean('canContinue', false)
    const referringDocuments = range(number('referringDocuments', 1))

    const actions = [
      canContinue && {
        name: 'confirm',
        title: hasReferringDocuments ? 'Try to unpublish anyway' : 'Unpublish now'
      },
      {name: 'cancel', title: 'Cancel', kind: 'secondary'}
    ].filter(Boolean)

    const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm unpublish'

    return (
      <Dialog
        isOpen
        showHeader
        centered
        title={title}
        onClose={() => console.log('handleClose')}
        onAction={() => console.log('handleAction')}
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
              Document title
              {'"'}
            </h3>
            <p>
              You may not be allowed to unpublish
              {' "'}
              Document title
              {'" '}
              as the following document{referringDocuments.length === 1 ? '' : 's'} refers to it:
            </p>
            List of documents
          </div>
        )}
        {!isCheckingReferringDocuments &&
          !hasReferringDocuments && (
            <div>
              <p>
                Are you sure you would like to unpublish the document{' '}
                <strong>Document title</strong>?
              </p>
              <h2>Careful!</h2>
              <p>
                If you unpublish, this document will no longer be available for the public, but it
                will not be deleted and can be published again later if you change your mind.
              </p>
            </div>
          )}
      </Dialog>
    )
  })
  .add('Error dialog', () => {
    const isNetworkError = boolean('isNetworkError')
    const message = text('message', 'An error occured')
    return (
      <Dialog color="danger" title="Error" isOpen centered>
        {!isNetworkError && <p>{message}</p>}
        {isNetworkError && (
          <DialogContent size="medium">
            <p>An error occured while attempting to reach the Sanity API.</p>
            <pre>Cors check goes here</pre>
          </DialogContent>
        )}

        <Button onClick={() => console.log('retry')}>Retry</Button>
      </Dialog>
    )
  })
