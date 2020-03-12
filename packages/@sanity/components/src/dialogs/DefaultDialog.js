/* eslint-disable complexity */
import React from 'react'
import styles from 'part:@sanity/components/dialogs/default-style'
import {Portal} from '../utilities/Portal'

export default function DefaultDialog(props) {
  return (
    <Portal>
      <div className={styles.root}>
        <div className={styles.dialog}>
          <div className={styles.content}>{props.children}</div>
        </div>
      </div>
    </Portal>
  )
}
