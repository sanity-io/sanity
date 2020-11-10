import React, {forwardRef} from 'react'

import styles from './tooltipArrow.css'

interface TooltipArrowProps {
  tone?: 'navbar'
}

export const TooltipArrow = forwardRef(
  (props: TooltipArrowProps & React.HTMLProps<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => {
    const {tone, ...restProps} = props

    return (
      <div {...restProps} className={styles.root} data-tone={tone} ref={ref}>
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path
            className={styles.border}
            d="M11.5266 1C11.032 1.32802 10.5837 1.73105 10.1995 2.20057L9.04792 3.6081C8.24771 4.58614 6.7523 4.58614 5.95209 3.6081L4.80047 2.20057C4.41632 1.73105 3.96796 1.32802 3.47341 1H0.156727C1.65639 1 3.07687 1.67313 4.02651 2.83381L5.17813 4.24134C6.37844 5.70839 8.62156 5.70839 9.82187 4.24134L10.9735 2.83381C11.9231 1.67313 13.3436 1 14.8433 1H11.5266Z"
          />
          <path
            className={styles.shape}
            d="M0.156725 0C1.95632 0 3.66089 0.80776 4.80047 2.20057L5.95209 3.6081C6.75229 4.58614 8.24771 4.58614 9.04791 3.6081L10.1995 2.20057C11.3391 0.80776 13.0437 0 14.8433 0H15H0H0.156725Z"
          />
        </svg>
      </div>
    )
  }
)

TooltipArrow.displayName = 'TooltipArrow'
