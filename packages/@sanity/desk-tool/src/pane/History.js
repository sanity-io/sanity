import PropTypes from 'prop-types'
import React from 'react'
import scroll from 'scroll'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import HistoryStore from 'part:@sanity/base/datastore/history'
import Snackbar from 'part:@sanity/components/snackbar/default'
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
  _listElement = React.createRef()

  getDocumentId = () => {
    const {published, draft} = this.props
    return (published && published._id) || (draft && draft._id)
  }

  componentDidMount() {
    this._isMounted = true
    const {documentId} = this.props
    this.eventStreamer = HistoryStore.eventStreamer$([
      documentId,
      `drafts.${documentId}`
    ]).subscribe({
      next: events => {
        if (this._isMounted) {
          this.setState({events, selectedRev: events[0].rev, loading: false})
        }
      }
    })
  }

  componentWillUnmount() {
    this.eventStreamer.unsubscribe()
  }

  componentDidUpdate(prevProps) {
    const {events, selectedRev} = this.state
    if (events && events[0].rev === selectedRev) {
      scroll.top(this._listElement.current, 0)
    }
  }

  handleItemClick = ({rev, type, title}) => {
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
              this.setState({errorMessage: `Sorry, we could not load history for ${title}`})
            }
          })
          .catch(res => {
            // eslint-disable-next-line no-console
            console.error(`Could not fetch revision ${rev}`, res)
            this.setState({errorMessage: `Sorry, we could not load history for ${title}`})
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
        <ArrowKeyNavigation
          className={styles.list}
          ref={this._listElement}
          component="div"
          mode={ArrowKeyNavigation.mode.VERTICAL}
        >
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
        </ArrowKeyNavigation>
        {errorMessage && (
          <Snackbar kind="danger" timeout={3} onHide={() => this.setState({errorMessage: undefined})}>
            {errorMessage}
          </Snackbar>
        )}
      </div>
    )
  }
}
