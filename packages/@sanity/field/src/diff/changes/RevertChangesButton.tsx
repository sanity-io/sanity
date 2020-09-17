import classNames from 'classnames'
import React from 'react'
import UndoIcon from 'part:@sanity/base/undo-icon'

import styles from './RevertChangesButton.css'

export function RevertChangesButton(
  props: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>
): React.ReactElement {
  const {className, ...restProps} = props

  return (
    <button {...restProps} className={classNames(styles.root, className)} type="button">
      <span className={styles.iconContainer}>
        <UndoIcon />
      </span>
      <span className={styles.text}>Revert changes</span>
    </button>
  )
}
