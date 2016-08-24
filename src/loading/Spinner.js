import React from 'react'
import styles from 'style:@sanity/components/loading/spinner'
import SpinnerIcon from 'icon:@sanity/spinner'

export default class Spinner extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <SpinnerIcon color="inherit" />
      </div>
    )
  }
}
