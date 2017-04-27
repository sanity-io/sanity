import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
// import styles from './styles/ReferringDocumentsHelper.css'
// import Diff from './Diff'
// import diffStyles from './styles/Diff.css'
// import {omit} from 'lodash'
//
// const IGNORE_KEYS = ['_createdAt', '_updatedAt', '_id', '_rev']
// const LEGEND_STYLE = {padding: 5, fontSize: '0.8rem'}

export default class ConfirmPublish extends React.PureComponent {
  handleAction = action => {
    const {onCancel, onConfirm} = this.props
    if (action.key === 'confirm') {
      onConfirm()
    }
    if (action.key === 'cancel') {
      onCancel()
    }
  }

  render() {
    const {draft, published, onCancel} = this.props
    const title = draft.title // todo
    const confirmAction = {key: 'confirm', title: `Yes, publish ${title}`}
    const cancelAction = {key: 'cancel', title: 'Cancel', kind: 'secondary'}
    return (
      <Dialog
        isOpen
        showHeader
        title="Confirm publish"
        onClose={onCancel}
        onAction={this.handleAction}
        actions={[confirmAction, cancelAction]}>
        <div style={{padding: 10}}>
          <p>
            Are you sure you would like to publish {title}?
          </p>
        </div>
        {/*<h3 className={styles.summaryHeadline}>*/}
        {/*Differences*/}
        {/*(*/}
        {/*<span style={LEGEND_STYLE} className={diffStyles.removed}>Removed</span>*/}
        {/*<span style={LEGEND_STYLE} className={diffStyles.added}>Added</span>*/}
        {/*)*/}
        {/*</h3>*/}
        {/*<Diff type="json" inputA={omit(published, IGNORE_KEYS)} inputB={omit(draft, IGNORE_KEYS)} />*/}
      </Dialog>
    )
  }
}

ConfirmPublish.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  published: PropTypes.object,
  draft: PropTypes.object
}
