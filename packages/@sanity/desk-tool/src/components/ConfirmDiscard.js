import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import moment from 'moment'

const CANCEL_ACTION = {name: 'cancel', title: 'Cancel', kind: 'secondary'}

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
    const {draft, published, onCancel} = this.props
    const title = draft.title // todo
    const confirmAction = {
      name: 'confirm',
      title: `Yes, discard ${published ? 'changes' : 'document'}`,
      color: 'danger'
    }
    return (
      <Dialog
        isOpen
        showHeader
        title={`Confirm discard ${published ? 'changes' : 'document'}`}
        centered
        onClose={onCancel}
        onAction={this.handleAction}
        actions={[confirmAction, CANCEL_ACTION]}
      >
        <div style={{padding: 10}}>
          <p>
            Are you sure you would like to discard {published ? 'changes in' : 'the document'} <strong>{title}</strong>?
          </p>
          <p>
            This will {
            published
              ? `revert to the latest published version of this document (published ${moment(published._updatedAt).fromNow()}).`
              : 'delete it entirely and there is no going back.'
          }
          </p>
        </div>
      </Dialog>
    )
  }
}
