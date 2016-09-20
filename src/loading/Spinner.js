import React from 'react'
import styles from 'part:@sanity/components/loading/spinner-style'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'

export default class Spinner extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <SpinnerIcon color="inherit" />
      </div>
    )
  }
}
