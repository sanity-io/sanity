import {type ReactNode} from 'react'

import * as styles from './OptionsGrid.module.css'

/**
 * The request options' column grid: as many columns of at least 180px as fit. Each child takes
 * one column; wrap one in `OptionsGridCell` to span two or to start a row.
 */
export function OptionsGrid({children, testId}: {children: ReactNode; testId?: string}) {
  return (
    <div className={styles.container}>
      <div className={styles.grid} data-testid={testId}>
        {children}
      </div>
    </div>
  )
}

interface OptionsGridCellProps {
  children: ReactNode
  /** Spans two columns, or the one column a narrow grid has */
  wide?: boolean
  /** Starts a new row instead of filling the rest of the previous one */
  startRow?: boolean
}

export function OptionsGridCell({children, wide, startRow}: OptionsGridCellProps) {
  const className = [wide && styles.wide, startRow && styles.startRow].filter(Boolean).join(' ')
  return <div className={className || undefined}>{children}</div>
}
