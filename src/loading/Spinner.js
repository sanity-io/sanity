import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/loading/spinner-style'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'

export default class Spinner extends React.Component {
  static propTypes = {
    inline: PropTypes.bool,
    message: PropTypes.string,
    fullscreen: PropTypes.bool,
    center: PropTypes.bool
  }

  renderSvg() {
    return (
      <svg width="126px" height="126px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
        <rect x="0" y="0" width="100" height="100" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="49.5"
          strokeDasharray="202.1614872585032 108.85618544688634"
          stroke="#000000"
          fill="none"
          strokeWidth="1"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 50 50;180 50 50;360 50 50;"
            keyTimes="0;0.5;1"
            dur="1s"
            repeatCount="indefinite"
            begin="0s"
          />
        </circle>
      </svg>
    )
  }

  render() {
    const {inline, message, fullscreen, center} = this.props
    return (
      <div
        className={`
          ${inline ? styles.inline : styles.block}
          ${fullscreen ? styles.fullscreen : ''}
          ${center ? styles.center : ''}
        `}
      >
        <div className={styles.inner}>
          {
            fullscreen ? this.renderSvg() : <SpinnerIcon color="inherit" />
          }
          {
            message && <div className={styles.message}>{message}</div>
          }
        </div>
      </div>
    )
  }
}
