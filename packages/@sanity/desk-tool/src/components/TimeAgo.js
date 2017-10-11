import PropTypes from 'prop-types'
import React from 'react'
import shallowEquals from 'shallow-equals'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

export default class TimeAgo extends React.PureComponent {

  static propTypes = {
    refreshInterval: PropTypes.number,
    time: PropTypes.string
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
    return <span>{distanceInWordsToNow(this.props.time, {addSuffix: true})}</span>
  }
}
