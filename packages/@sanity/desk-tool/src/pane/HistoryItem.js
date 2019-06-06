import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import UserStore from 'part:@sanity/base/user'
import {format} from 'date-fns'

const {getUsers} = UserStore

export default class HistoryItem extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string,
    rev: PropTypes.string,
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
      title: format(this.props.endTime, 'D MMM HH:mm:ss')
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
        title={format(endTime, 'D MMM HH:mm:ss')}
        subtitle={`debug rev: ${rev}`}
        users={users}
        onClick={this.handleClick}
        isSelected={isSelected}
      />
    )
  }
}
