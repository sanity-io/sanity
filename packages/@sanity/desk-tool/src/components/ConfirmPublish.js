import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import DocTitle from './DocTitle'

const ACTIONS = [
  {name: 'confirm', title: 'Publish now', color: 'success', autoFocus: true, inverted: false},
  {name: 'cancel', title: 'Cancel'}
]
const NOTHING_TO_PUBLISH_ACTIONS = [
  {name: 'cancel', title: 'Close', color: 'success', autoFocus: true},
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

    if (!draft) {
      return (
        <Dialog
          isOpen
          centered
          showHeader
          title="No changes"
          actions={NOTHING_TO_PUBLISH_ACTIONS}
          onAction={this.handleAction}
        >
          Nothing to publish!
        </Dialog>
      )
    }
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
            Are you sure you would like to publish the document{' '}
            <strong>
              <DocTitle document={(draft || published)} />
            </strong>?
          </p>
          <p>
            {published && `It was last published ${distanceInWordsToNow(published._updatedAt, {addSuffix: true})}.`}
          </p>
        </div>
      </Dialog>
    )
  }
}
