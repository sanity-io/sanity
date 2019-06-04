import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import Button from 'part:@sanity/components/buttons/default'
import {HistoryStore} from '../../../history-store/lib'
import UserStore from 'part:@sanity/base/user'
import {format} from 'date-fns'

const {getUsers} = UserStore

export default class HistoryItem extends React.PureComponent {
  static propTypes = {
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
    this.props.onClick(this.props.rev, this.props.type)
  }

  state = {users: []}

  render() {
    const {type, endTime, isSelected, isCurrentVersion, rev} = this.props
    const {users} = this.state
    return (
      <HistoryListItem
        isCurrentVersion={isCurrentVersion}
        status={type}
        title={format(endTime, 'DD MMM HH:mm:ss')}
        subtitle={`debug rev: ${rev}`}
        users={users}
        onClick={this.handleClick}
        isSelected={isSelected}
      />
    )
  }
}
