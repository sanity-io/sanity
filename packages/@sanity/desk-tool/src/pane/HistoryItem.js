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
    isSelected: PropTypes.bool
  }

  componentDidMount() {
    getUsers(this.props.userIds).then(users => {
      this.setState({users})
    })
  }

  handleClick = () => {
    this.props.onClick(this.props.rev, this.props.type)
  }

  state = {users: []}

  render() {
    const {type, endTime, isSelected} = this.props
    const {users} = this.state
    return (
      <HistoryListItem
        status={type}
        title={format(endTime, 'DD MMM HH:MM')}
        users={users}
        onClick={this.handleClick}
        isSelected={isSelected}
      />
    )
  }
}
