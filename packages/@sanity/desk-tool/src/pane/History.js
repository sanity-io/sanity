import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import HistoryStore from 'part:@sanity/base/datastore/history'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {transactionsToEvents} from '@sanity/transaction-collator'
import HistoryItem from './HistoryItem'

import styles from './styles/History.css'

export default class History extends React.PureComponent {
  static propTypes = {
    onClose: PropTypes.func,
    documentId: PropTypes.string,
    onItemSelect: PropTypes.func,
    currentRev: PropTypes.string,
    publishedRev: PropTypes.string,
    lastEdited: PropTypes.object,
    errorMessage: PropTypes.string
  }

  state = {events: [], selectedRev: undefined, errorMessage: undefined}

  componentDidMount() {
    const {documentId} = this.props
    HistoryStore.getTransactions([documentId, `drafts.${documentId}`]).then(transactions => {
      const events = transactionsToEvents(documentId, transactions).reverse()
      this.setState({events, selectedRev: events[0].rev})
    })
  }

  handleItemClick = (rev, type) => {
    const {onItemSelect, documentId, currentRev} = this.props
    if (onItemSelect) {
      if (currentRev === rev) {
        this.setState({selectedRev: rev})
        onItemSelect({
          value: null,
          status: null
        })
      } else {
        HistoryStore.getHistory(documentId, {revision: rev})
          .then(({documents}) => {
            if (documents && documents[0]) {
              this.setState({selectedRev: rev})
              onItemSelect({
                value: documents[0],
                status: type
              })
            }
          })
          .catch(res => {
            console.error(res)
            this.setState({errorMessage: `Could not fetch rev: ${rev}`})
          })
      }
    }
  }

  render() {
    const {onClose, publishedRev} = this.props
    const {events, selectedRev, errorMessage} = this.state

    if (!events || !events[0]) {
      return <div>Loading</div>
    }

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          History
          <Button onClick={onClose} title="Close" icon={CloseIcon} bleed kind="simple" />
        </div>
        <div className={styles.list}>
          {events.map(event => (
            <HistoryItem
              {...event}
              key={event.rev}
              onClick={this.handleItemClick}
              isSelected={event.rev === selectedRev}
              isCurrentVersion={event.rev === publishedRev}
            />
          ))}
        </div>
        {errorMessage && (
          <Snackbar kind="danger" timeout={3}>
            {errorMessage}
          </Snackbar>
        )}
      </div>
    )
  }
}
