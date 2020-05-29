import classNames from 'classnames'
import PropTypes from 'prop-types'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import styles from 'part:@sanity/components/loading/spinner-style'
import React from 'react'
import {Portal} from '../utilities/Portal'

export default class Spinner extends React.PureComponent {
  static propTypes = {
    center: PropTypes.bool,
    children: PropTypes.node,
    delay: PropTypes.number, // delay in ms
    fullscreen: PropTypes.bool,
    inline: PropTypes.bool,
    message: PropTypes.string
  }

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

    console.log('delay', delay)

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
