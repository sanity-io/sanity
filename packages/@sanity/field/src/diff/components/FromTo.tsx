import React from 'react'
import ArrowIcon from 'part:@sanity/base/arrow-right'

import styles from './FromTo.css'

export interface FromToProps {
  layout?: 'grid' | 'inline'
  from?: React.ReactElement | boolean | null | ''
  to?: React.ReactElement | boolean | null | ''
  children?: React.ReactNode
}

export const FromToArrow = () => (
  <div className={styles.arrow}>
    <ArrowIcon />
  </div>
)

export function FromTo({layout = 'inline', from, to, children}: FromToProps) {
  return (
    <div className={styles.root} data-layout={layout}>
      {from && <div className={styles.from}>{from}</div>}
      {from && to && <FromToArrow />}
      {to && <div className={styles.to}>{to}</div>}
      {children}
    </div>
  )
}
