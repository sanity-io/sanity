import React from 'react'
import ArrowIcon from 'part:@sanity/base/arrow-right'
import styles from './DiffLayout.css'

export interface DiffLayoutProps {
  layout?: 'grid' | 'inline'
  from?: React.ReactElement | boolean | null | ''
  to?: React.ReactElement | boolean | null | ''
  children?: React.ReactNode
}

export const DiffArrow = () => (
  <div className={styles.arrow}>
    <ArrowIcon />
  </div>
)

export function DiffLayout({layout = 'inline', from, to, children}: DiffLayoutProps) {
  return (
    <div className={styles.root} data-layout={layout}>
      {from}
      {from && to && <DiffArrow />}
      {to}
      {children}
    </div>
  )
}
