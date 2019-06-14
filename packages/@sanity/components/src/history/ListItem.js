import PropTypes from 'prop-types'
import React from 'react'
import {Tooltip} from 'react-tippy'
import PresenceCircle from '../presence/PresenceCircle'
import PresenceList from '../presence/PresenceList'
import colorHasher from '../presence/colorHasher'

import styles from './styles/ListItem.modules.css'

const MAX_USERS = 3

export default class HistoryListItem extends React.PureComponent {
  static propTypes = {
    status: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    isCurrentVersion: PropTypes.bool,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown: PropTypes.func,
    rev: PropTypes.string,
    tooltip: PropTypes.string,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        imageUrl: PropTypes.string,
        id: PropTypes.string
      })
    )
  }

  static defaultProps = {
    status: 'unknown',
    title: 'Untitled',
    onClick: () => {},
    onKeyUp: () => {},
    onKeyDown: () => {},
    isCurrentVersion: false,
    isSelected: false,
    users: [],
    children: undefined,
    rev: undefined
  }

  _rootElement = React.createRef()

  componentDidUpdate(prevProps) {
    const {isSelected} = this.props
    // Focus the element when it becomes selected
    if (isSelected && (!prevProps || !prevProps.isSelected)) {
      this.focus()
    }
  }

  focus() {
    if (this._rootElement && this._rootElement.current) {
      this._rootElement.current.focus()
    }
  }

  render() {
    const {
      status,
      isSelected,
      title,
      users,
      children,
      isCurrentVersion,
      onClick,
      rev,
      onKeyUp,
      onKeyDown,
      tooltip
    } = this.props

    return (
      <div
        className={isSelected ? styles.selected : styles.unSelected}
        data-status={status}
        data-is-current-version={isCurrentVersion}
        data-rev={rev}
        onClick={onClick}
        tabIndex="0"
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        title={tooltip}
        ref={this._rootElement}
      >
        <div className={styles.startLine} aria-hidden="true" />
        <div className={styles.endLine} aria-hidden="true" />
        <div className={styles.status}>{status}</div>
        <div className={styles.title}>{title}</div>
        {users && users.length > 0 && (
          <Tooltip
            html={
              <PresenceList
                markers={users.map(user => ({
                  type: 'presence',
                  identity: user.id,
                  color: colorHasher(user.id),
                  user: {...user}
                }))}
              />
            }
            disabled={users.length < 2}
            interactive
            position="top"
            trigger="mouseenter"
            animation="scale"
            arrow
            theme="light"
            distance="10"
            duration={50}
          >
            <div className={styles.users}>
              {users.slice(0, MAX_USERS).map(user => (
                <div className={styles.user} key={user.id}>
                  <PresenceCircle
                    title={users.length === 1 ? undefined : user.displayName}
                    showTooltip={false}
                    imageUrl={user.imageUrl}
                    color={colorHasher(user.id)}
                  />
                </div>
              ))}
              {users.length === 1 && <div className={styles.userName}>{users[0].displayName}</div>}
              {users.length > 1 && (
                <div className={styles.extraItems}>
                  <div className={styles.userName}>{users.length} people</div>
                </div>
              )}
            </div>
          </Tooltip>
        )}
        {children && <div className={styles.children}>{children}</div>}
      </div>
    )
  }
}
