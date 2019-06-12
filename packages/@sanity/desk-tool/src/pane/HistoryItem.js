import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import UserStore from 'part:@sanity/base/user'
import {format, isYesterday, isToday} from 'date-fns'

const {getUsers} = UserStore

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
  static defaultProps = {
    displayDocumentId: undefined
  }

  static propTypes = {
    displayDocumentId: PropTypes.string,
    endTime: PropTypes.instanceOf(Date).isRequired,
    isCurrentVersion: PropTypes.bool.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    rev: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    userIds: PropTypes.arrayOf(PropTypes.string).isRequired
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
    const {rev, type, displayDocumentId, endTime} = this.props
    if (displayDocumentId) {
      return this.props.onClick({
        rev,
        type,
        displayDocumentId,
        title: getDateString(endTime)
      })
    }
    // eslint-disable-next-line no-console
    return console.error(
      `No displayDocumentId tied to the event type '${type}', not doing the click action`
    )
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
