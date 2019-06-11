import PropTypes from 'prop-types'
import React from 'react'
import shallowEquals from 'shallow-equals'
import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears
} from 'date-fns'

function dateFormat(d) {
  const now = Date.now()
  const diffSeconds = differenceInSeconds(now, d)
  const diffMins = differenceInMinutes(now, d)
  const diffHours = differenceInHours(now, d)
  const diffDays = differenceInDays(now, d)
  const diffWeeks = differenceInWeeks(now, d)
  const diffMonths = differenceInMonths(now, d)
  const diffYears = differenceInYears(now, d)

  if (diffMonths || diffYears) return format(d, 'MMM D, YYYY, hh:mm A')
  if (diffWeeks) return `${diffWeeks}w ago`
  if (diffDays) return `${diffDays}d ago`
  if (diffHours) return `${diffHours}h ago`
  if (diffMins) return `${diffMins}m ago`
  if (diffSeconds) return `${diffMins}s ago`

  return format(d, 'MMM D, YYYY, hh:mm A')
}

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
    return <span title={timestamp}>{dateFormat(this.props.time)}</span>
  }
}
