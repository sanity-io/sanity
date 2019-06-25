import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import DocTitle from './DocTitle'

const CANCEL_ACTION = {name: 'cancel', title: 'Cancel', kind: 'simple', secondary: true}

export default class ConfirmDiscard extends React.PureComponent {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    published: PropTypes.object,
    draft: PropTypes.object
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
    const {draft, published} = this.props
    const confirmAction = {
      name: 'confirm',
      title: `Discard ${published ? 'changes' : 'draft'}`,
      color: 'danger'
    }
    return (
      <Dialog
        isOpen
        showHeader
        title={`Discard ${published ? 'changes' : 'document'}`}
        centered
        onAction={this.handleAction}
        actions={[confirmAction, CANCEL_ACTION]}
      >
        <p>
          Are you sure you would like to discard {published ? 'changes in' : 'the document'}{' '}
          <strong>
            <DocTitle document={draft || published} />
          </strong>
          ?
        </p>
        <p>
          This will{' '}
          {published
            ? `revert to the latest published version of this document (published ${distanceInWordsToNow(
                published._updatedAt,
                {addSuffix: true}
              )}).`
            : 'delete it entirely and there is no going back.'}
        </p>
      </Dialog>
    )
  }
}
