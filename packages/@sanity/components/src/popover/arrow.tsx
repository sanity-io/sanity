import React, {forwardRef} from 'react'

import styles from './arrow.css'

export const PopoverArrow = forwardRef((props: React.HTMLProps<HTMLDivElement>, ref) => {
  return (
    <div {...props} className={styles.root} ref={ref as any}>
      <svg
        width="27"
        height="11"
        viewBox="0 0 27 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className={styles.arrowBorderGroup}>
          <path d="M1.18359 10.0001C3.2959 10.0001 5.29525 9.04623 6.62431 7.40445L11.1684 1.79112C12.3691 0.307911 14.6312 0.307907 15.8319 1.79112L20.376 7.40445C21.7051 9.04622 23.7044 10.0001 25.8167 10.0001H21.9437C21.0534 9.50751 20.2547 8.84388 19.5988 8.03364L15.0547 2.42031C14.2542 1.43151 12.7461 1.43151 11.9457 2.42032L7.40155 8.03365C6.74565 8.84388 5.9469 9.50751 5.05659 10.0001H1.18359Z" />
        </g>
        <path
          d="M19.5986 8.03365L15.0545 2.42031C14.254 1.43151 12.746 1.43151 11.9455 2.42031L7.40138 8.03365C5.88246 9.90996 3.59749 11.0001 1.18342 11.0001H0H27H25.8166C23.4025 11.0001 21.1175 9.90996 19.5986 8.03365Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
})

PopoverArrow.displayName = 'PopoverArrow'
