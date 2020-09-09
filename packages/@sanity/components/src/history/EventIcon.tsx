import React from 'react'

import styles from './EventIcon.module.css'

interface EventIconProps {
  className: string
  type?: string
}

function EventIcon({className, type}: EventIconProps) {
  switch (type) {
    case 'created':
      return <div className={`${className} ${styles.created}`} aria-hidden="true" />
    case 'edited':
      return <div className={`${className} ${styles.edited}`} aria-hidden="true" />
    case 'published':
      return <div className={`${className} ${styles.published}`} aria-hidden="true" />
    case 'unpublished':
      return <div className={`${className} ${styles.unpublished}`} aria-hidden="true" />
    case 'truncated':
      return (
        <svg
          className={`${className} ${styles.truncated}`}
          aria-hidden="true"
          viewBox="0 0 9 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.97136 7.3637C7.14598 8.36308 5.89737 9 4.5 9C2.01472 9 0 6.98528 0 4.5C0 2.01472 2.01472 0 4.5 0C5.90844 0 7.16575 0.647052 7.99089 1.66011L3.5 4.59783L7.97136 7.3637Z"
            fill="currentColor"
          />
        </svg>
      )
    default:
      return <div className={`${className} ${styles.edited}`} aria-hidden="true" />
  }
}

export default EventIcon
