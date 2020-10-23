import React from 'react'
import EventIcon from './EventIcon'

import styles from './ListItem.modules.css'

interface HistoryListItemProps {
  status?: string
  title?: string
  children?: React.ReactNode
  isCurrentVersion?: boolean
  isSelected?: boolean
  onSelect: (evt: React.MouseEvent<HTMLDivElement>) => void
  onEnterKey: () => void
  onArrowUpKey: () => void
  onArrowDownKey: () => void
  rev?: string
  tooltip?: string
  type?: string
  users?: {
    name?: string
    email?: string
    imageUrl?: string
    id?: string
  }[]
  linkParams?: Record<string, unknown>
  linkComponent?: React.ComponentType<{params: Record<string, unknown>}>
}

const noop = () => undefined

export default class HistoryListItem extends React.PureComponent<HistoryListItemProps> {
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
    linkComponent: undefined,
  }

  _rootElement: React.RefObject<HTMLDivElement> = React.createRef()

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

  handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const {onEnterKey} = this.props
    if (event.key === 'Enter') {
      onEnterKey()
    }
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  handleSelect = (evt: React.MouseEvent<HTMLDivElement>) => {
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
      children,
      isCurrentVersion,
      rev,
      tooltip,
      type,
    } = this.props
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

        {children && <div className={styles.children}>{children}</div>}
      </>
    )

    const rootProps = {
      className: selectionClassName,
      'data-type': type,
      'data-is-current-version': isCurrentVersion,
      'data-is-selected': isSelected,
      'data-rev': rev,
      tabIndex: type === 'truncated' ? undefined : 0,
      onKeyUp: this.handleKeyUp,
      onKeyDown: this.handleKeyDown,
      title: tooltip,
      ref: this._rootElement,
    }

    const ParameterizedLink = linkComponent
    const linkRev = isCurrentVersion ? '-' : rev

    return ParameterizedLink ? (
      <ParameterizedLink params={{...linkParams, rev: linkRev}} {...rootProps}>
        {content}
      </ParameterizedLink>
    ) : (
      <div {...rootProps} onClick={this.handleSelect}>
        {content}
      </div>
    )
  }
}
