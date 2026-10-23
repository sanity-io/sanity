import {useState} from 'react'

import {arrows, checkmark, circle, root, rotateGroup} from './AnimatedStatusIcon.css'

interface AnimatedStatusIconProps {
  status?: 'changes' | 'saved' | 'syncing'
}

export function AnimatedStatusIcon(props: AnimatedStatusIconProps) {
  const {status} = props
  // The icon mounts in its current state; only later status changes animate
  const [previousStatus, setPreviousStatus] = useState(status)
  const [hasChanged, setHasChanged] = useState(false)
  if (status !== previousStatus) {
    setPreviousStatus(status)
    setHasChanged(true)
  }

  if (!status) {
    return null
  }

  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      data-sanity-icon="animated-status-icon"
      data-status={status}
      data-animate={hasChanged ? '' : undefined}
    >
      <g className={root}>
        <g className={rotateGroup} data-rotate={status === 'changes' ? undefined : ''}>
          <path
            className={arrows}
            fill="none"
            d="M14 17.5619L11.5 20.5L14.5 23.0619M11 7.43811L13.5 4.50001L10.5 1.93811"
          />
          <circle className={circle} fill="none" r="8" cx="12.5" cy="12.5" strokeWidth="1.2" />
        </g>
        <path className={checkmark} d="M9.5 12.1316L11.7414 14.5L16 10" pathLength={1} />
      </g>
    </svg>
  )
}
