import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/loading/spinner-style'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'

export default class Spinner extends React.Component {
  static propTypes = {
    inline: PropTypes.bool,
    message: PropTypes.string,
    fullscreen: PropTypes.bool
  }
  render() {
    const {inline, message, fullscreen} = this.props
    return (
      <div
        className={`
          ${inline ? styles.inline : styles.block}
          ${fullscreen && styles.fullscreen}
        `}
      >
        <div className={styles.inner}>
          <SpinnerIcon color="inherit" />
          {
            message && <div className={styles.message}>{message}</div>
          }
        </div>
      </div>
    )
  }
}
