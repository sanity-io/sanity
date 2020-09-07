import classNames from 'classnames'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import styles from 'part:@sanity/components/loading/spinner-style'
import React from 'react'
import {Portal} from '../utilities/Portal'

interface SpinnerProps {
  center: boolean
  children: React.ReactNode
  delay: number // delay in ms
  fullscreen: boolean
  inline: boolean
  message: string
}

export default class Spinner extends React.PureComponent<SpinnerProps> {
  static defaultProps = {
    center: false,
    children: null,
    delay: 300,
    fullscreen: false,
    inline: false,
    message: undefined
  }

  render() {
    const {inline, message, fullscreen, center, delay, children} = this.props
    const className = classNames(
      inline ? styles.inline : styles.block,
      fullscreen && styles.fullscreen,
      center && styles.center
    )

    const rootStyle = {
      animationDelay: `${delay}ms`
    }

    const root = (
      <div className={className} style={rootStyle}>
        <div className={styles.inner}>
          <span className={styles.iconContainer}>
            <SpinnerIcon />
          </span>

          {/* @todo: Wrap in a container */}
          {children}

          {!children && message && <div className={styles.message}>{message}</div>}
        </div>
      </div>
    )

    if (fullscreen) {
      return <Portal>{root}</Portal>
    }

    return root
  }
}
