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

export function formatTimeAgo(date) {
  const now = Date.now()
  const diffSeconds = differenceInSeconds(now, date)
  const diffMins = differenceInMinutes(now, date)
  const diffHours = differenceInHours(now, date)
  const diffDays = differenceInDays(now, date)
  const diffWeeks = differenceInWeeks(now, date)
  const diffMonths = differenceInMonths(now, date)
  const diffYears = differenceInYears(now, date)

  if (diffMonths || diffYears) return format(date, 'MMM D, YYYY, hh:mm A')
  if (diffWeeks) return `${diffWeeks}w ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays) return `${diffDays}d ago`
  if (diffHours) return `${diffHours}h ago`
  if (diffMins) return `${diffMins}m ago`
  if (diffSeconds > 5) return `${diffSeconds}s ago`

  return 'just now'
}

export default class TimeAgo extends React.PureComponent {
  static propTypes = {
    refreshInterval: PropTypes.number,
    time: PropTypes.string.isRequired
  }

  static defaultProps = {
    refreshInterval: 1000 * 5
  }

  componentDidMount() {
    this.start()
  }

  componentWillUnmount() {
    this.stop()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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
    return <span title={timestamp}>{formatTimeAgo(this.props.time)}</span>
  }
}
