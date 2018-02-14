// eslint-disable max-len
// @flow
import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/UploadPlaceholder.css'
import PasteIcon from 'part:@sanity/base/paste-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'

export default class UploadPlaceholder extends React.PureComponent {
  static propTypes = {
    hasFocus: PropTypes.bool
  }
  render() {
    const {hasFocus} = this.props
    return (
      <div className={hasFocus ? styles.hasFocus : styles.noFocus}>
        <div className={styles.inner}>
          <div className={styles.dropFile}>
            <div className={styles.iconContainer}>
              <UploadIcon />
            </div>
            <p className={styles.strong}>
              <span>Drop file</span>
            </p>
          </div>
          <div className={styles.pasteFile}>
            <div className={styles.iconContainer}>
              <svg
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 30 37"
                shapeRendering="geometricPrecision"
              >
                <path
                  className={styles.eyeRight}
                  fill="none"
                  stroke="currentColor"
                  height="1em"
                  width="1em"
                  d="M4.75,0.75C4.75,0.75,2.95914,0.75,0.75,0.75C-1.45914,0.75,-3.25,0.75,-3.25,0.75C-3.25,0.75,-1.45914,0.75,0.75,0.75C2.95914,0.75,4.75,0.75,4.75,0.75Z"
                  transform="translate(19.75,16.75)"
                />
                <path
                  className={styles.eyeLeft}
                  fill="none"
                  stroke="currentColor"
                  d="M4.75,0.75C4.75,0.75,2.95914,0.75,0.75,0.75C-1.45914,0.75,-3.25,0.75,-3.25,0.75C-3.25,0.75,-1.45914,0.75,0.75,0.75C2.95914,0.75,4.75,0.75,4.75,0.75Z"
                  transform="translate(8.75,16.75)"
                />
                <path
                  id="Shape"
                  d="M26.6,33.4L26.6,6.6L23.4,6.6L23.4,11.6L6.6,11.6L6.6,6.6L3.4,6.6L3.4,33.4L26.6,33.4ZM15,3.4C14.1,3.4,13.4,4.1,13.4,5C13.4,5.9,14.1,6.6,15,6.6C15.9,6.6,16.6,5.9,16.6,5C16.6,4.1,15.9,3.4,15,3.4L15,3.4ZM26.6,3.4C28.4,3.4,30,4.8,30,6.6L30,33.4C30,35.2,28.4,36.6,26.6,36.6L3.4,36.6C1.6,36.6,0,35.2,0,33.4L0,6.6C0,4.8,1.6,3.4,3.4,3.4L10.3,3.4C11,1.4,12.8,0,15,0C17.2,0,19,1.4,19.7,3.4L26.6,3.4L26.6,3.4Z"
                  fillRule="nonzero"
                  fill="currentColor"
                  stroke="none"
                  strokeWidth="1"
                />
                <path
                  className={styles.smile}
                  d="M0,0C0,0,4.5,0,10,0C15.5,0,19,0,19,0"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="square"
                  transform="translate(5.5,26.5)"
                />
              </svg>
            </div>
            <div>
              <p className={styles.strong}>
                <span>Paste file</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
