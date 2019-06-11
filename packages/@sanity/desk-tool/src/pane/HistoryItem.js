import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import UserStore from 'part:@sanity/base/user'
import {format, isYesterday, isToday} from 'date-fns'

const {getUsers} = UserStore

const dateFormat = ''

function getDateString(date) {
  if (isToday(date)) {
    return `Today, ${format(date, 'hh:mm A')}`
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'hh:mm A')}`
  }
  return format(date, 'MMM D, YYYY, hh:mm A')
}

export default class HistoryItem extends React.PureComponent {
  static propTypes = {
    rev: PropTypes.string.isRequired,
    type: PropTypes.string,
    endTime: PropTypes.object,
    userIds: PropTypes.arrayOf(PropTypes.string),
    onClick: PropTypes.func,
    isSelected: PropTypes.bool,
    isCurrentVersion: PropTypes.bool
  }

  componentDidMount() {
    const {userIds} = this.props
    if (!userIds) {
      return
    }
    getUsers(userIds).then(users => {
      this.setState({users})
    })
  }

  handleClick = () => {
    this.props.onClick({
      rev: this.props.rev,
      type: this.props.type,
      title: getDateString(this.props.endTime)
    })
  }

  state = {users: []}

  render() {
    const {type, endTime, isSelected, isCurrentVersion, rev} = this.props
    const {users} = this.state
    return (
      <HistoryListItem
        isCurrentVersion={isCurrentVersion}
        status={type}
        title={getDateString(endTime)}
        rev={rev}
        users={users}
        onClick={this.handleClick}
        isSelected={isSelected}
      />
    )
  }
}
