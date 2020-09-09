import * as React from 'react'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import {FieldValueError} from '../../validation'
import styles from './ValueError.css'

export function ValueError({error}: {error: FieldValueError}) {
  return (
    <div className={styles.root}>
      <span className={styles.icon}>
        <ErrorOutlineIcon />
      </span>
      <span className={styles.message}>Value error: {error.message}</span>
    </div>
  )
}
