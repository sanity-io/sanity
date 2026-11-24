import {type ReactNode} from 'react'

import * as styles from './OptionsGrid.module.css'

interface OptionsGridProps {
  /** The selects, in as many columns of at least 180px as fit */
  fields: ReactNode
  /** The toggles, which halve their own row when the panel has room for two and stack otherwise */
  toggles: ReactNode
  testId?: string
}

/**
 * The request options: a row of selects over a row of toggles. Both follow the width of the
 * panel they are in, not the window's, so they reflow alike when a sidebar drawer or a splitter
 * takes room from the panel and when the window narrows.
 */
export function OptionsGrid({fields, toggles, testId}: OptionsGridProps) {
  return (
    <div className={styles.container} data-testid={testId}>
      <div className={styles.stack}>
        <div className={styles.fields} data-testid="vision-options-fields">
          {fields}
        </div>
        <div className={styles.toggles} data-testid="vision-options-toggles">
          {toggles}
        </div>
      </div>
    </div>
  )
}
