import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import userstore from 'part:@sanity/base/user'
import {format, isYesterday, isToday} from 'date-fns'

const {getUsers} = userstore
const dateFormat = 'MMM D, YYYY, hh:mm A'

function getDateString(date) {
  if (isToday(date)) {
    return `Today, ${format(date, 'hh:mm A')}`
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'hh:mm A')}`
  }
  return format(date, dateFormat)
}

function getHumanReadableStatus(type) {
  if (type === 'discardDraft') return 'Discarded Edits'
  if (type === 'truncated') return 'Truncated Events'
  if (type === 'unknown') return 'Edited'
  return type
}

export default class HistoryItem extends React.PureComponent {
  static defaultProps = {
    isSelected: false,
    userIds: undefined
  }

  static propTypes = {
    endTime: PropTypes.string.isRequired,
    isCurrentVersion: PropTypes.bool.isRequired,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    onSelectNext: PropTypes.func,
    onSelectPrev: PropTypes.func,
    rev: PropTypes.string.isRequired,
    type: PropTypes.oneOf([
      'created',
      'deleted',
      'edited',
      'published',
      'unpublished',
      'truncated',
      'unknown'
    ]).isRequired,
    userIds: PropTypes.arrayOf(PropTypes.string)
  }

  componentDidMount() {
    this._isMounted = true
    const {userIds} = this.props
    if (!userIds) {
      return
    }
    getUsers(userIds).then(users => {
      if (this._isMounted) {
        this.setState({users})
      }
    })
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  handleKeyUp = event => {
    const {onClick} = this.props
    if (event.key === 'Enter') {
      onClick()
    }
  }

  handleKeyDown = event => {
    // Prevent arrow keypress scrolling
    const {onSelectPrev, onSelectNext} = this.props
    if (event.key === 'ArrowDown') {
      onSelectNext()
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      onSelectPrev()
      event.preventDefault()
    }
  }

  state = {users: []}

  render() {
    const {type, endTime, isSelected, isCurrentVersion, rev, onClick} = this.props
    const {users} = this.state
    return (
      <HistoryListItem
        isCurrentVersion={isCurrentVersion}
        status={getHumanReadableStatus(type)}
        type={type}
        title={getDateString(endTime)}
        tooltip={format(endTime, dateFormat)}
        rev={rev}
        users={users}
        onClick={onClick}
        onKeyUp={this.handleKeyUp}
        onKeyDown={this.handleKeyDown}
        isSelected={isSelected}
      />
    )
  }
}
