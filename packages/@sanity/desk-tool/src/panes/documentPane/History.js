import PropTypes from 'prop-types'
import React from 'react'
import scroll from 'scroll'
import CloseIcon from 'part:@sanity/base/close-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import Button from 'part:@sanity/components/buttons/default'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import HistoryItem from './HistoryItem'

import styles from './History.css'

export default class History extends React.PureComponent {
  static propTypes = {
    events: PropTypes.arrayOf(PropTypes.object),
    onClose: PropTypes.func,
    documentId: PropTypes.string,
    onItemSelect: PropTypes.func,
    isLoading: PropTypes.bool,
    lastEdited: PropTypes.object,
    errorMessage: PropTypes.string,
    selectedEvent: PropTypes.object,
    selectedRev: PropTypes.string,
    historyValue: PropTypes.object,
    error: PropTypes.object
  }

  static defaultProps = {
    isLoading: true
  }

  state = {
    headerShadowOpacity: 0
  }

  _listElement = React.createRef()

  componentDidMount() {
    if (this._listElement && this._listElement.current) {
      this._listElement.current.addEventListener('scroll', this.handleListScroll, {passive: true})
    }

    this.handleScrollToSelected()
  }

  componentWillUnmount() {
    if (this._listElement && this._listElement.current) {
      this._listElement.current.removeEventListener('scroll', this.handleListScroll)
    }
  }

  handleListScroll = event => {
    const {scrollTop} = event.target
    this.setState({
      headerShadowOpacity: Math.min(scrollTop, 50) / 100
    })
  }

  componentDidUpdate(prevProps) {
    const {selectedRev, events, historyValue, isLoading} = this.props
    if (prevProps.historyValue && !historyValue && events[0].rev === selectedRev) {
      this.handleNewCurrentEvent()
    }

    if (prevProps.isLoading && !isLoading) {
      this.handleScrollToSelected()
    }
  }

  handleNewCurrentEvent = () => {
    if (this._listElement && this._listElement.current) {
      scroll.top(this._listElement.current, 0)
    }
  }

  handleScrollToSelected = () => {
    const {events, selectedEvent} = this.props
    const selectedIndex = events.indexOf(selectedEvent)

    if (selectedIndex > 0 && this._listElement && this._listElement.current) {
      const listElement = this._listElement.current.childNodes[selectedIndex]
      // Leave a bit of room at the top if possible, to indicate that we've scrolled
      const scrollTo = Math.max(0, listElement.getBoundingClientRect().top - 250)
      scroll.top(this._listElement.current, scrollTo)
    }
  }

  handleSelectNext = () => {
    const {events, selectedEvent, onItemSelect} = this.props
    const i = events.indexOf(selectedEvent)
    const newSelection = i === -1 ? null : events[i + 1]
    if (newSelection) {
      onItemSelect(newSelection)
    }
  }

  handleSelectPrev = () => {
    const {events, selectedEvent, onItemSelect} = this.props
    const i = events.indexOf(selectedEvent)
    const newSelection = i === -1 ? null : events[i - 1]
    if (newSelection) {
      onItemSelect(newSelection)
    }
  }

  render() {
    const {onClose, events, onItemSelect, selectedEvent, isLoading, error} = this.props
    const {headerShadowOpacity} = this.state
    return (
      <div className={styles.root}>
        <div
          className={styles.header}
          style={{boxShadow: `0 0px 2px rgba(0, 0, 0, ${headerShadowOpacity})`}}
        >
          <h3 className={styles.title}>
            <span>History</span>
          </h3>
          <div className={styles.closeButtonContainer}>
            <Button
              onClick={onClose}
              title="Close history"
              icon={CloseIcon}
              kind="simple"
              padding="small"
            />
          </div>
        </div>
        <div className={styles.info}>
          {isLoading && <Spinner center message="Loading events..." />}
          {error && (
            <div className={styles.errorMessage}>
              <ErrorIcon />
              <div>Could not load events</div>
            </div>
          )}
        </div>
        {!(isLoading || error) && (
          <div className={styles.list} ref={this._listElement}>
            {events.map((event, i) => (
              <HistoryItem
                {...event}
                key={event.rev}
                isSelected={event === selectedEvent}
                isCurrentVersion={i === 0}
                onClick={() => onItemSelect(event)}
                onSelectPrev={this.handleSelectPrev}
                onSelectNext={this.handleSelectNext}
              />
            ))}
          </div>
        )}
        {error && <Snackbar kind="error" isPersisted title={error} />}
      </div>
    )
  }
}
