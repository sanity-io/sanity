import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/loading/spinner-style'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import {Portal} from '../utilities/Portal'

export default class Spinner extends React.PureComponent {
  static propTypes = {
    inline: PropTypes.bool,
    message: PropTypes.string,
    fullscreen: PropTypes.bool,
    center: PropTypes.bool,
    delay: PropTypes.number // delay in ms
  }

  static defaultProps = {
    delay: 300
  }

  renderSpinner() {
    const {inline, message, fullscreen, center, delay} = this.props
    return (
      <div
        style={{animationDelay: `${delay}ms`}}
        className={`
          ${inline ? styles.inline : styles.block}
          ${fullscreen ? styles.fullscreen : ''}
          ${center ? styles.center : ''}
        `}
      >
        <div className={styles.inner}>
          <span className={styles.icon}>
            <SpinnerIcon />
          </span>
          {message && <div className={styles.message}>{message}</div>}
        </div>
      </div>
    )
  }

  render() {
    const {fullscreen} = this.props
    return fullscreen ? <Portal>{this.renderSpinner()}</Portal> : this.renderSpinner()
  }
}
