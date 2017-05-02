import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import moment from 'moment'

const ACTIONS = [
  {name: 'confirm', title: 'Yes, publish now', color: 'success'},
  {name: 'cancel', title: 'Cancel', kind: 'secondary'}
]

export default class ConfirmPublish extends React.PureComponent {
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
        title="Confirm publish"
        centered
        onClose={onCancel}
        onAction={this.handleAction}
        actions={ACTIONS}
      >
        <div style={{padding: 10}}>
          <p>
            Are you sure you would like to publish <strong>{title}</strong>?
          </p>
          <p>
            {published && `It was last published ${moment(published._updatedAt).fromNow()}`}
          </p>
        </div>
      </Dialog>
    )
  }
}
