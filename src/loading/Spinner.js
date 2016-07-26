import React from 'react'
import styles from 'style:@sanity/components/loading/spinner'
import Circle from 'react-icons/lib/fa/circle-o-notch'

export default class Spinner extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <Circle />
      </div>
    )
  }
}
