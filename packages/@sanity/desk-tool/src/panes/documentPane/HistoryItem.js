/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/require-default-props */

import PropTypes from 'prop-types'
import React from 'react'
import {from} from 'rxjs'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import historyStore from 'part:@sanity/base/user'
import {format, isYesterday, isToday} from 'date-fns'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'

const EMPTY_PARAMS = {}
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
  static contextType = PaneRouterContext

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
      'discardDraft',
      'unknown'
    ]).isRequired,
    userIds: PropTypes.arrayOf(PropTypes.string)
  }

  componentDidMount() {
    const {userIds} = this.props
    if (!userIds) {
      return
    }

    this.usersSubscription = from(historyStore.getUsers(userIds)).subscribe(users => {
      this.setState({users})
    })
  }

  componentWillUnmount() {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe()
    }
  }

  handleEnterKey = () => {
    this.props.onClick()
  }

  handleArrowDownKey = () => {
    this.props.onSelectNext()
  }

  handleArrowUpKey = () => {
    this.props.onSelectPrev()
  }

  state = {users: []}

  render() {
    const {ParameterizedLink, params} = this.context
    const {type, endTime, isSelected, isCurrentVersion, rev, onClick} = this.props
    const {users} = this.state
    const {rev: oldRev, ...linkParams} = params
    return (
      <HistoryListItem
        linkComponent={ParameterizedLink}
        linkParams={Object.keys(linkParams).length === 0 ? EMPTY_PARAMS : linkParams}
        isCurrentVersion={isCurrentVersion}
        status={getHumanReadableStatus(type)}
        type={type}
        title={getDateString(endTime)}
        tooltip={format(endTime, dateFormat)}
        rev={rev}
        users={users}
        onSelect={onClick}
        onEnterKey={this.handleEnterKey}
        onArrowUpKey={this.handleArrowUpKey}
        onArrowDownKey={this.handleArrowDownKey}
        isSelected={isSelected}
      />
    )
  }
}
