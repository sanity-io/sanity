import classNames from 'classnames'
import {omit} from 'lodash'
import React from 'react'
import styles from 'part:@sanity/components/buttons/in-input-style'
import Spinner from 'part:@sanity/components/loading/spinner'

interface InInputButtonProps {
  kind?: 'add' | 'danger' | 'colored' | 'secondary'
  inverted?: boolean
  icon?: React.ComponentType<React.SVGProps<SVGElement>>
  loading?: boolean
  colored?: boolean
}

// @todo: refactor to functional component
export default class InInputButton extends React.Component<
  InInputButtonProps & React.HTMLProps<HTMLButtonElement>
> {
  handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onClick) this.props.onClick(event)
  }

  render() {
    const {kind, inverted, colored, icon, loading, className: classNameProp, ...restProps} = omit(
      this.props,
      'onAction'
    )

    const Icon = icon

    if (kind && !styles[kind]) {
      // eslint-disable-next-line no-console
      console.warn(`There is no ${kind} button`)
    }

    const className = classNames(
      classNameProp,
      inverted && styles.inverted,
      kind && styles[kind],
      colored && styles.colored,
      Icon && styles.hasIcon
    )

    return (
      <button {...restProps} className={className} type="button" onClick={this.handleClick}>
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
