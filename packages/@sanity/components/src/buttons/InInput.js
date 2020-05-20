import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/in-input-style'
import Spinner from 'part:@sanity/components/loading/spinner'
import {omit} from 'lodash'

export default class InInputButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['add', 'danger', 'colored', 'secondary']),
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    inverted: PropTypes.bool,
    icon: PropTypes.func,
    loading: PropTypes.bool,
    colored: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool
  }

  static defaultProps = {
    icon() {
      return null
    },
    onClick() {}
  }

  constructor(...args) {
    super(...args)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    this.props.onClick(event)
  }

  render() {
    const {kind, inverted, colored, icon, loading, className, ...rest} = omit(
      this.props,
      'onAction'
    )

    const Icon = icon

    if (!styles[kind] && kind) {
      console.error(`There is no ${kind} button`) // eslint-disable-line no-console
    }

    const style = `
      ${className || ''}
      ${(inverted && styles.inverted) || ''}
      ${styles[kind] ? styles[kind] : styles.root}
      ${colored && styles.colored ? styles.colored : ''}
      ${Icon && styles.hasIcon ? styles.hasIcon : ''}
    `

    return (
      <button {...rest} className={style} type="button" onClick={this.handleClick}>
        <span className={styles.content}>
          {loading && <Spinner />}
          {Icon && (
            <span className={styles.iconContainer}>
              <Icon className={styles.icon} />
            </span>
          )}
          <span className={styles.text}>{this.props.children}</span>
        </span>
      </button>
    )
  }
}
