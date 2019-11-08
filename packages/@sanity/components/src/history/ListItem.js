import PropTypes from 'prop-types'
import React from 'react'
import {Tooltip} from 'react-tippy'
import PresenceCircle from '../presence/PresenceCircle'
import PresenceList from '../presence/PresenceList'
import colorHasher from '../presence/colorHasher'
import EventIcon from './EventIcon'

import styles from './styles/ListItem.modules.css'

const noop = () => {} // eslint-disable-line no-empty-function
const MAX_USERS = 3

const DECIMALS = 2
const DISTANCE_BETWEEN_POINTS = 5
const offset = 100
const radius = 50

function makeClipPath() {
  let p = ''
  for (let i = 90; i <= 270; i += DISTANCE_BETWEEN_POINTS) {
    const x = radius * Math.cos((i * Math.PI) / 180)
    const y = radius * Math.sin((i * Math.PI) / 180)
    p += `,${(offset + x).toFixed(DECIMALS)}% ${(50 + y).toFixed(DECIMALS)}%`
  }
  return `polygon(0 0,0 100%${p},0 0)`
}

export default class HistoryListItem extends React.PureComponent {
  static propTypes = {
    status: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    isCurrentVersion: PropTypes.bool,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func,
    onEnterKey: PropTypes.func,
    onArrowUpKey: PropTypes.func,
    onArrowDownKey: PropTypes.func,
    rev: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        imageUrl: PropTypes.string,
        id: PropTypes.string
      })
    ),
    // eslint-disable-next-line react/forbid-prop-types
    linkParams: PropTypes.object,
    linkComponent: PropTypes.elementType
  }

  static defaultProps = {
    status: 'Edited',
    title: undefined,
    onSelect: noop,
    onEnterKey: noop,
    onArrowUpKey: noop,
    onArrowDownKey: noop,
    isCurrentVersion: false,
    isSelected: false,
    users: [],
    children: undefined,
    rev: undefined,
    linkParams: undefined,
    linkComponent: undefined
  }

  _rootElement = React.createRef()

  componentDidUpdate(prevProps) {
    const {isSelected} = this.props

    // Focus the element when it becomes selected
    if (isSelected && !prevProps.isSelected) {
      this.focus()
    }
  }

  focus() {
    if (this._rootElement && this._rootElement.current) {
      this._rootElement.current.focus()
    }
  }

  handleKeyUp = event => {
    const {onEnterKey} = this.props
    if (event.key === 'Enter') {
      onEnterKey()
    }
  }

  handleKeyDown = event => {
    // Prevent arrow keypress scrolling
    const {onArrowUpKey, onArrowDownKey} = this.props
    if (event.key === 'ArrowDown') {
      onArrowDownKey()
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      onArrowUpKey()
      event.preventDefault()
    }
  }

  handleSelect = evt => {
    this.props.onSelect(evt)
  }

  // eslint-disable-next-line complexity
  render() {
    const {
      linkComponent,
      linkParams,
      status,
      isSelected,
      title,
      users,
      children,
      isCurrentVersion,
      rev,
      tooltip,
      type
    } = this.props
    const availableUsers = users.filter(Boolean)
    const selectionClassName = isSelected ? styles.selected : styles.unSelected

    const content = (
      <>
        <EventIcon className={styles.icon} type={type} />
        <div className={styles.startLine} aria-hidden="true" />
        <div className={styles.endLine} aria-hidden="true" />
        <div className={styles.status}>{status}</div>
        {title && type !== 'truncated' && <div className={styles.title}>{title}</div>}
        {type === 'truncated' && (
          <div className={styles.truncatedInfo}>
            <p>
              <a
                href="https://www.sanity.io/docs/content-studio/history-experience"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn about history retention
              </a>
            </p>
          </div>
        )}
        {availableUsers && availableUsers.length > 0 && (
          <Tooltip
            html={
              <PresenceList
                markers={availableUsers.map(user => ({
                  type: 'presence',
                  identity: user.id,
                  color: colorHasher(user.id),
                  user: {...user}
                }))}
              />
            }
            disabled={availableUsers.length < 2}
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
              <div className={styles.userIcons}>
                {availableUsers.slice(0, MAX_USERS).map((user, i) => (
                  <div className={styles.user} key={user.id}>
                    <div className={styles.userInner} style={{clipPath: makeClipPath()}}>
                      <PresenceCircle
                        title={users.length === 1 ? undefined : user.displayName}
                        showTooltip={false}
                        imageUrl={user.imageUrl}
                        color={user.imageUrl ? undefined : colorHasher(user.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {availableUsers.length === 1 && (
                <div className={styles.userName}>{availableUsers[0].displayName}</div>
              )}
              {availableUsers.length > 1 && (
                <div className={styles.extraItems}>
                  <div className={styles.userName}>{availableUsers.length} people</div>
                </div>
              )}
            </div>
          </Tooltip>
        )}
        {children && <div className={styles.children}>{children}</div>}
      </>
    )

    const rootProps = {
      className: selectionClassName,
      'data-type': type,
      'data-is-current-version': isCurrentVersion,
      'data-is-selected': isSelected,
      'data-rev': rev,
      tabIndex: type === 'truncated' ? null : '0',
      onKeyUp: this.handleKeyUp,
      onKeyDown: this.handleKeyDown,
      title: tooltip,
      ref: this._rootElement
    }

    const ParameterizedLink = linkComponent

    return ParameterizedLink ? (
      <ParameterizedLink params={{...linkParams, rev}} {...rootProps}>
        {content}
      </ParameterizedLink>
    ) : (
      <div {...rootProps} onClick={this.handleSelect}>
        {content}
      </div>
    )
  }
}
