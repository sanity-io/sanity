import React, {PropTypes} from 'react'
import DropZone from 'react-dropzone'

import styles from 'part:@sanity/components/fileinput/dropzone-style'

export default class Dropzone extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    multiple: PropTypes.bool
  }

  static defaultProps = {
    multiple: true
  }

  render() {

    const {className, multiple} = this.props

    return (
      <DropZone
        className={`
          ${className ? className : ''}
          ${styles.dropZone}
        `}
        activeClassName={styles.activeDropZone}
        {...this.props}
      >
        <div className={styles.inner}>
          <div className={styles.text}>
            <p className={styles.strong}>
              {
                multiple ? <div>Select files</div> : <div>Select files</div>
              }
            </p>
            <p className={styles.light}>
              {
                multiple ? <div>…or drop them here</div> : <div>…or drop it here</div>
              }
            </p>
          </div>
        </div>
      </DropZone>
    )
  }
}
