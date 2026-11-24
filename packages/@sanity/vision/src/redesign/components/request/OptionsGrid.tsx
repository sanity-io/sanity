import {type ReactNode} from 'react'

import * as styles from './OptionsGrid.module.css'

interface OptionsGridProps {
  children: ReactNode
  testId?: string
}

/**
 * The request options, selects and toggles alike, in as many columns of at least 180px as the
 * panel has room for. The columns follow the width of the panel, not the window's, so they
 * reflow alike when a sidebar drawer or a splitter takes room from the panel and when the window
 * narrows.
 */
export function OptionsGrid({children, testId}: OptionsGridProps) {
  return (
    <div className={styles.container} data-testid={testId}>
      <div className={styles.grid} data-testid="vision-options-grid">
        {children}
      </div>
    </div>
  )
}

/**
 * A cell for a toggle, lined up with the selects' inputs when it shares a row with them. A `wide`
 * cell spans two columns, or the whole row when the panel only has room for one column.
 */
export function OptionsGridToggleCell({children, wide}: {children: ReactNode; wide?: boolean}) {
  return (
    <div
      className={wide ? `${styles.toggle} ${styles.wide}` : styles.toggle}
      data-testid="vision-options-toggle-cell"
    >
      {children}
    </div>
  )
}
