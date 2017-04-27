import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
import moment from 'moment'

const ACTIONS = [
  {name: 'confirm', title: 'Yes, discard changes'},
  {name: 'cancel', title: 'Cancel', kind: 'secondary'}
]

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
    return (
      <Dialog
        isOpen
        showHeader
        title="Confirm discard changes"
        onClose={onCancel}
        onAction={this.handleAction}
        actions={ACTIONS}>
        <div style={{padding: 10}}>
          <p>
            Are you sure you would like to discard changes in <strong>{title}</strong>?
          </p>
          <p>
            It will revert to the latest published version of this document
            {published && ` (as published ${moment(published._updatedAt).fromNow()})`}
          </p>
        </div>
      </Dialog>
    )
  }
}
