import classNames from 'classnames'
import React, {forwardRef} from 'react'
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

export const FromTo = forwardRef(
  (
    {
      children,
      className,
      layout = 'inline',
      from,
      to,
      ...restProps
    }: FromToProps & React.HTMLProps<HTMLDivElement>,
    ref
  ) => {
    return (
      <div
        {...restProps}
        className={classNames(styles.root, className)}
        data-from-to-layout={layout}
        ref={ref as any}
      >
        {from && <div className={styles.from}>{from}</div>}
        {from && to && <FromToArrow />}
        {to && <div className={styles.to}>{to}</div>}
        {children}
      </div>
    )
  }
)

FromTo.displayName = 'FromTo'
