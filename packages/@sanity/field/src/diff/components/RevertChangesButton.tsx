import classNames from 'classnames'
import React, {forwardRef} from 'react'
import UndoIcon from 'part:@sanity/base/undo-icon'

import styles from './RevertChangesButton.css'

export const RevertChangesButton = forwardRef(
  (props: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>, ref): React.ReactElement => {
    const {className, selected, ...restProps} = props

    return (
      <button
        {...restProps}
        className={classNames(styles.root, selected && styles.selected, className)}
        ref={ref as any}
        type="button"
      >
        <span className={styles.iconContainer}>
          <UndoIcon />
        </span>
        <span className={styles.text}>Revert changes</span>
      </button>
    )
  }
)

RevertChangesButton.displayName = 'RevertChangesButton'
