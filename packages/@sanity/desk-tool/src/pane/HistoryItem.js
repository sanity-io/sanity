import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import UserStore from 'part:@sanity/base/user'
import {format} from 'date-fns'

const {getUsers} = UserStore

const dateFormat = 'Do of MMMM YYYY HH:mm:ss '

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
      title: format(this.props.endTime, dateFormat)
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
        title={format(endTime, dateFormat)}
        subtitle={`debug rev: ${rev}`}
        users={users}
        onClick={this.handleClick}
        isSelected={isSelected}
      />
    )
  }
}
