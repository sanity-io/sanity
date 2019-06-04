import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/History.css'
import {HistoryStore} from '../../../history-store/lib'
import {transactionsToEvents} from '../../../transaction-collator/lib'
import HistoryItem from './HistoryItem'

export default class History extends React.PureComponent {
  static propTypes = {
    onClose: PropTypes.func,
    documentId: PropTypes.string,
    onItemSelect: PropTypes.func,
    currentRev: PropTypes.string,
    publishedRev: PropTypes.string,
    lastEdited: PropTypes.object
  }

  state = {events: [], selectedRev: undefined}

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
      this.setState({selectedRev: rev})
      if (currentRev === rev) {
        onItemSelect({
          value: null,
          status: null
        })
      } else {
        HistoryStore.getHistory(documentId, {revision: rev}).then(({documents}) => {
          if (documents && documents[0]) {
            onItemSelect({
              value: documents[0],
              status: type
            })
          }
        })
      }
    }
  }

  render() {
    const {onClose, publishedRev} = this.props
    const {events, selectedRev} = this.state

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
      </div>
    )
  }
}
