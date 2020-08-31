import React from 'react'

import styles from './RevertChangesButton.css'

export function RevertChangesButton({onClick}: {onClick?: () => void}) {
  return (
    <button className={styles.root} onClick={onClick} type="button">
      Revert changes
    </button>
  )
}
