// eslint-disable max-len
import React from 'react'
import UploadIcon from 'part:@sanity/base/upload-icon'

import styles from './UploadPlaceholder.css'

type UploadPlaceholderProps = {
  hasFocus?: boolean
  fileType?: 'image' | 'file'
}

export default class UploadPlaceholder extends React.PureComponent<UploadPlaceholderProps, {}> {
  render() {
    const {hasFocus, fileType = 'file'} = this.props
    return (
      <div className={hasFocus ? styles.hasFocus : styles.noFocus}>
        <div className={styles.inner}>
          <div className={styles.dropFile}>
            <div className={styles.iconContainer}>
              <UploadIcon />
            </div>
            <p className={styles.strong}>
              <span>{`Drop ${fileType}`}</span>
            </p>
          </div>
          <div className={styles.pasteFile}>
            <div className={styles.iconContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" height="1em" width="1em">
                {!hasFocus && (
                  <g>
                    <path
                      fill="currentColor"
                      d="M32.38 3.76H24.8a5.41 5.41 0 0 0-10.22 0H7a3.62 3.62 0 0 0-3.62 3.62v29A3.62 3.62 0 0 0 7 40h25.38A3.62 3.62 0 0 0 36 36.38v-29a3.62 3.62 0 0 0-3.62-3.62zm-12.69 0a1.81 1.81 0 1 1-1.81 1.81 1.81 1.81 0 0 1 1.81-1.81zm12.69 32.62H7v-29h3.62v5.44h18.13V7.38h3.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.29 29.13h14.38v1.63H12.29zM12.29 18.04h4.02v1.42h-4.02zM22.84 18.04h4.02v1.42h-4.02z"
                    />
                  </g>
                )}
                {hasFocus && (
                  <g>
                    <path
                      fill="currentColor"
                      d="M32.49 3.62h-7.56a5.4 5.4 0 0 0-10.19 0H7.18a3.62 3.62 0 0 0-3.62 3.61v28.93a3.62 3.62 0 0 0 3.62 3.62h25.31a3.62 3.62 0 0 0 3.62-3.62V7.23a3.62 3.62 0 0 0-3.62-3.61zm-12.65 0A1.81 1.81 0 1 1 18 5.42a1.81 1.81 0 0 1 1.84-1.8zm12.65 32.54H7.18V7.23h3.61v5.43h18.09V7.23h3.61z"
                    />
                    <path
                      fill="currentColor"
                      d="M20 33.15c-6.26 0-8.44-4.22-8.53-4.4l1.73-.86-.87.43.87-.44c.07.14 1.78 3.34 6.8 3.34s6.73-3.2 6.8-3.34l1.72.87c-.09.18-2.27 4.4-8.52 4.4zM12.45 18.62h4.01v3.72h-4.01zM22.98 18.62h4.01v3.72h-4.01z"
                    />
                  </g>
                )}
              </svg>
            </div>
            <div>
              <p className={styles.strong}>
                <span>{`Paste ${fileType}`}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
