import React from 'react'
import ArrowIcon from 'part:@sanity/base/arrow-right'

import styles from './ChangeLayout.css'

export interface ChangeLayoutProps {
  layout?: 'grid' | 'inline'
  from?: React.ReactElement | boolean | null | ''
  to?: React.ReactElement | boolean | null | ''
  children?: React.ReactNode
}

export const ChangeArrow = () => (
  <div className={styles.arrow}>
    <ArrowIcon />
  </div>
)

export function ChangeLayout({layout = 'inline', from, to, children}: ChangeLayoutProps) {
  return (
    <div className={styles.root} data-layout={layout}>
      {from && <div className={styles.from}>{from}</div>}
      {from && to && <ChangeArrow />}
      {to && <div className={styles.to}>{to}</div>}
      {children}
    </div>
  )
}
