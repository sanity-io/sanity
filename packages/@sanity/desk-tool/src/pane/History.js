import PropTypes from 'prop-types'
import React from 'react'
import scroll from 'scroll'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import HistoryItem from './HistoryItem'

import styles from './styles/History.css'

const maybe = (val, fn) => val && fn(val)

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
    const {selectedRev, events, historyValue} = this.props
    if (prevProps.historyValue && !historyValue && events[0].rev === selectedRev) {
      this.handleNewCurrentEvent()
    }
  }

  handleNewCurrentEvent = () => {
    if (this._listElement && this._listElement.current) {
      scroll.top(this._listElement.current, 0)
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
        {isLoading && <Spinner center message="Loading history" />}
        {error && <p>Could not load history</p>}
        <div className={styles.list} ref={this._listElement}>
          {!(isLoading || error) &&
            events.map((event, i) => (
              <HistoryItem
                {...event}
                key={event.rev}
                onClick={() => onItemSelect(events[i])}
                isSelected={event === selectedEvent}
                isCurrentVersion={i === 0}
                onSelectPrev={() => maybe(events[i - 1], onItemSelect)}
                onSelectNext={() => maybe(events[i + 1], onItemSelect)}
              />
            ))}
        </div>
        {error && <Snackbar kind="error" isPersisted title={error} />}
      </div>
    )
  }
}
