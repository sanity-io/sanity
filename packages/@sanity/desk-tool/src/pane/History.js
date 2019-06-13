import PropTypes from 'prop-types'
import React from 'react'
import scroll from 'scroll'
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
    published: PropTypes.object,
    historyValue: PropTypes.object
  }

  state = {
    events: [],
    selectedRev: undefined,
    errorMessage: undefined,
    loading: true,
    headerShadowOpacity: 0
  }
  _listElement = React.createRef()

  getDocumentId = () => {
    const {published, draft} = this.props
    return (published && published._id) || (draft && draft._id)
  }

  componentDidMount() {
    this._isMounted = true
    const {documentId} = this.props
    if (this._listElement.current && this._listElement.current) {
      this._listElement.current.addEventListener('scroll', this.handleListScroll, {passive: true})
    }
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

  handleListScroll = event => {
    const {scrollTop} = event.target
    this.setState({
      headerShadowOpacity: Math.min(scrollTop, 50) / 100
    })
  }

  componentWillUnmount() {
    this.eventStreamer.unsubscribe()
  }

  componentDidUpdate(prevProps) {
    const {events} = this.state
    const {currentRev, historyValue} = this.props
    if (prevProps.historyValue && !historyValue && events[0].rev === currentRev) {
      this.handleNewCurrentEvent()
    }
  }

  handleNewCurrentEvent = () => {
    if (this._listElement && this._listElement.current) {
      scroll.top(this._listElement.current, 0)
    }
  }

  handleSelectEvent = event => {
    const {onItemSelect, currentRev} = this.props
    if (!event) {
      return
    }
    const {rev, type, title, displayDocumentId} = event
    if (!rev || !type || !displayDocumentId) {
      return
    }
    if (onItemSelect) {
      if (currentRev === rev) {
        this.setState({selectedRev: rev})
        onItemSelect({
          value: null,
          status: null
        })
      } else {
        HistoryStore.getHistory(displayDocumentId, {revision: rev})
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

  handleItemClick = props => {
    this.handleSelectEvent(props)
  }

  render() {
    const {onClose, publishedRev} = this.props
    const {
      events,
      selectedRev,
      errorMessage,
      loadingError,
      loading,
      headerShadowOpacity
    } = this.state

    return (
      <div className={styles.root}>
        <div
          className={styles.header}
          style={{boxShadow: `0 0px 2px rgba(0, 0, 0, ${headerShadowOpacity})`}}
        >
          History
          <Button
            onClick={onClose}
            title="Close"
            icon={CloseIcon}
            bleed
            kind="simple"
            className={styles.closeButton}
          />
        </div>
        {loading && <Spinner center message="Loading history" />}
        {loadingError && <p>Could not load history</p>}
        <div className={styles.list} ref={this._listElement}>
          {!loadingError &&
            !loading &&
            events &&
            events.map((event, i) => (
              <HistoryItem
                {...event}
                key={event.rev}
                onClick={this.handleItemClick}
                isSelected={!!selectedRev && event.rev === selectedRev}
                isCurrentVersion={event.rev === publishedRev}
                onSelectPrev={() => this.handleSelectEvent(events[i - 1])}
                onSelectNext={() => this.handleSelectEvent(events[i + 1])}
              />
            ))}
        </div>
        {errorMessage && (
          <Snackbar
            kind="danger"
            timeout={3}
            onHide={() => this.setState({errorMessage: undefined})}
          >
            {errorMessage}
          </Snackbar>
        )}
      </div>
    )
  }
}
