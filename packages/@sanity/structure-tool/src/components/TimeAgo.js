import PropTypes from 'prop-types'
import React from 'react'
import shallowEquals from 'shallow-equals'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import format from 'date-fns/format'

export default class TimeAgo extends React.PureComponent {
  static propTypes = {
    refreshInterval: PropTypes.number,
    time: PropTypes.string.isRequired
  }

  static defaultProps = {
    refreshInterval: 1000 * 30
  }

  componentDidMount() {
    this.start()
  }

  componentWillUnmount() {
    this.stop()
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowEquals(this.props, nextProps)) {
      this.stop()
      this.start()
    }
  }

  update = () => {
    this.forceUpdate()
  }

  start() {
    this.update()
    this.intervalId = setInterval(this.update, this.props.refreshInterval)
  }

  stop() {
    clearInterval(this.intervalId)
  }

  render() {
    const timestamp = format(this.props.time, 'MMM D, YYYY, h:mm A Z')
    return <span title={timestamp}>{distanceInWordsToNow(this.props.time, {addSuffix: true})}</span>
  }
}
