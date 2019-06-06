import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import HistoryStore from 'part:@sanity/base/datastore/history'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {transactionsToEvents} from '@sanity/transaction-collator'
import Spinner from 'part:@sanity/components/loading/spinner'
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
    errorMessage: PropTypes.string,
    draft: PropTypes.object,
    published: PropTypes.object
  }

  state = {events: [], selectedRev: undefined, errorMessage: undefined, loading: true}

  getDocumentId = () => {
    const {published, draft} = this.props
    return (published && published._id) || (draft && draft._id)
  }

  componentDidMount() {
    const {documentId} = this.props
    this.streamer = HistoryStore.eventStreamer$([documentId, `drafts.${documentId}`]).subscribe({
      next: events => {
        this.setState({events, selectedRev: events[0].rev})
      },
      error: error => {
        console.error(error) // eslint-disable-line no-console
        this.setState({errorMessage: `Could not setup history event subscriber`})
      }
    })
  }

  componentWillUnmount() {
    this.streamer.unsubscribe()
  }

  handleItemClick = ({rev, type}) => {
    const {onItemSelect, currentRev} = this.props
    const documentId = this.getDocumentId()
    if (onItemSelect) {
      if (currentRev === rev) {
        this.setState({selectedRev: rev})
        onItemSelect({
          value: null,
          status: null
        })
      } else {
        HistoryStore.getHistory(documentId, {revision: rev})
          .then(res => {
            const {documents} = res
            if (documents && documents[0]) {
              this.setState({selectedRev: rev})
              onItemSelect({
                value: documents[0],
                status: type
              })
            } else {
              // eslint-disable-next-line no-console
              console.error(`Got no document for revision ${rev}`, res)
              this.setState({errorMessage: `Could not fetch rev: ${rev}`})
            }
          })
          .catch(res => {
            // eslint-disable-next-line no-console
            console.error(`Could not fetch revision ${rev}`, res)
            this.setState({errorMessage: `Could not fetch rev: ${rev}`})
          })
      }
    }
  }

  render() {
    const {onClose, publishedRev} = this.props
    const {events, selectedRev, errorMessage, loadingError, loading} = this.state

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          History
          <Button onClick={onClose} title="Close" icon={CloseIcon} bleed kind="simple" />
        </div>
        {loading && <Spinner center message="Loading history" />}
        {loadingError && <p>Could not load history</p>}
        <div className={styles.list}>
          {!loadingError &&
            !loading &&
            events &&
            events.map(event => (
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
