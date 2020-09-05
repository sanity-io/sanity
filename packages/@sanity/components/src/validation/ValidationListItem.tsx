import classNames from 'classnames'
import React from 'react'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import {Marker} from '../types'

import styles from './ValidationListItem.css'

type Props = {
  kind: string
  onClick: (event: any, path: any) => void
  showLink?: boolean
  path: string
  hasFocus?: boolean
  truncate?: boolean
  marker: Marker
}

export default class ValidationListItem extends React.PureComponent<Props> {
  static defaultProps = {
    kind: '',
    path: '',
    onClick: undefined,
    showLink: false,
    truncate: false
  }
  _element: any

  componentDidMount() {
    if (this.props.hasFocus) {
      this.focus()
    }
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.handleClick(event)
    }
  }

  focus() {
    setTimeout(() => {
      this._element.focus()
    }, 200)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.hasFocus) {
      this.focus()
    }
  }

  handleClick = event => {
    const {marker, onClick} = this.props
    if (onClick) {
      onClick(event, marker.path)
    }
  }

  setElement = element => {
    this._element = element
  }

  render() {
    const {kind, marker, onClick, path, truncate} = this.props

    return (
      <a
        data-item-type={kind}
        ref={this.setElement}
        tabIndex={0}
        onClick={this.handleClick}
        onKeyPress={this.handleKeyPress}
        className={classNames(
          onClick ? styles.interactiveItem : styles.item,
          styles[marker.level],
          truncate && styles.truncate
        )}
      >
        <span className={styles.icon}>
          <ErrorOutlineIcon />
        </span>

        <div className={styles.content}>
          {path && <div className={styles.path}>{path}</div>}
          {marker.item.message && <div className={styles.message}>{marker.item.message}</div>}
        </div>
      </a>
    )
  }
}
