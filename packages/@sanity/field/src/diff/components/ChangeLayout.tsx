import React from 'react'
import ArrowIcon from 'part:@sanity/base/arrow-right'

import styles from './ChangeLayout.css'

export interface ChangeLayoutProps {
  layout?: 'fluid' | 'fixed'
  direction?: 'vertical' | 'horizontal'
  from?: React.ReactElement | boolean | null | ''
  to?: React.ReactElement | boolean | null | ''
  children?: React.ReactNode
}

export const ChangeArrow = ({direction}: {direction?: string}) => (
  <div className={styles.arrow} data-direction={direction}>
    <ArrowIcon />
  </div>
)

export function ChangeLayout({
  layout = 'fluid',
  direction = 'horizontal',
  from,
  to,
  children
}: ChangeLayoutProps) {
  return (
    <div className={styles.root} data-layout={layout} data-direction={direction}>
      {from && <div className={styles.from}>{from}</div>}
      {from && to && <ChangeArrow direction={direction} />}
      {to && <div className={styles.to}>{to}</div>}
      {children}
    </div>
  )
}
