import React from 'react'
import styles from './DiffLayout.css'
import ArrowIcon from 'part:@sanity/base/arrow-right'

// TODO: typings
type DiffLayoutProps = {
  layout?: 'grid' | 'inline'
  renderFrom: any
  renderTo: any
  children?: any
}

export const DiffArrow = () => (
  <div className={styles.arrow}>
    <ArrowIcon />
  </div>
)

export function DiffLayout({layout = 'inline', renderFrom, renderTo, children}: DiffLayoutProps) {
  return (
    <div className={styles.root} data-layout={layout}>
      {renderFrom && renderFrom}
      {renderFrom && renderTo && <DiffArrow />}
      {renderTo && renderTo}
      {children && children}
    </div>
  )
}
