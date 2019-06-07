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
    status: PropTypes.oneOf(['published', 'edited', 'created', 'unpublished', 'draft', 'unknown']),
    title: PropTypes.string,
    subtitle: PropTypes.string,
    children: PropTypes.node,
    isCurrentVersion: PropTypes.bool,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
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
    subtitle: null,
    onClick: () => {},
    isCurrentVersion: false,
    isSelected: false,
    users: [],
    children: undefined
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
      subtitle
    } = this.props

    return (
      <div
        className={isSelected ? styles.selected : styles.unSelected}
        data-status={status}
        data-is-current-version={isCurrentVersion}
        onClick={onClick}
      >
        <div className={styles.startLine} aria-hidden="true" />
        <div className={styles.endLine} aria-hidden="true" />
        <div className={styles.status}>{status}</div>
        <div className={styles.title}>{title}</div>
        <div style={{fontSize: '0.5em'}}>{subtitle}</div>
        {users &&
          users.length > 0 && (
            <div className={styles.users}>
              {users.slice(0, MAX_USERS).map(user => (
                <div className={styles.user} key={user.id}>
                  <PresenceCircle
                    title={users.length === 1 ? false : user.displayName}
                    imageUrl={user.imageUrl}
                    color={colorHasher(user.id)}
                  />
                </div>
              ))}
              {users.length === 1 && <div className={styles.userName}>{users[0].displayName}</div>}
              {users.length > 1 && (
                <div className={styles.extraItems}>
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
                    interactive
                    position="top"
                    trigger="mouseenter"
                    animation="scale"
                    arrow
                    theme="light"
                    distance="10"
                    duration={50}
                  >
                    <div className={styles.userName}>{users.length} people</div>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        {children && <div className={styles.children}>{children}</div>}
      </div>
    )
  }
}
