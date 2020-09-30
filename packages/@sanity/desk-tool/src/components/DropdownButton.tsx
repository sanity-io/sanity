import classNames from 'classnames'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import React from 'react'

import styles from './DropdownButton.css'

interface DropdownButtonProps {
  children: React.ReactNode
}

export function DropdownButton(
  props: DropdownButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'type'>
) {
  const {children, selected, ...restProps} = props

  return (
    <button
      {...restProps}
      className={classNames(styles.root, selected && styles.selected)}
      type="button"
    >
      <span className={styles.content}>{children}</span>
      <span className={styles.iconContainer}>
        <ChevronDownIcon />
      </span>
    </button>
  )
}
