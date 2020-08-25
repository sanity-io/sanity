import React, {forwardRef} from 'react'

import styles from './arrow.css'

export const Arrow = forwardRef(
  (props: React.HTMLProps<HTMLDivElement> & {tone?: 'navbar'}, ref) => (
    <div {...props} className={styles.root} data-tone={props.tone} ref={ref as any}>
      <svg width="15" height="6" viewBox="0 0 15 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className={styles.outlineGroup}>
          <path d="M11.5851 5H15C13.4011 5 11.8867 4.28234 10.8742 3.04489L9.82187 1.75866C8.62156 0.29161 6.37844 0.291607 5.17813 1.75866L4.12576 3.04489C3.1133 4.28234 1.59886 5 0 5H3.41494C3.97027 4.64429 4.4726 4.20015 4.89971 3.67813L5.95209 2.39189C6.75229 1.41386 8.24771 1.41386 9.04791 2.3919L10.1003 3.67813C10.5274 4.20016 11.0297 4.64429 11.5851 5Z" />
        </g>
        <path
          d="M14.8433 6C13.0437 6 11.3391 5.19224 10.1995 3.79943L9.04791 2.3919C8.24771 1.41386 6.75229 1.41386 5.95209 2.39189L4.80047 3.79943C3.66089 5.19224 1.95632 6 0.156725 6H0H15H14.8433Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
)

Arrow.displayName = 'Arrow'
