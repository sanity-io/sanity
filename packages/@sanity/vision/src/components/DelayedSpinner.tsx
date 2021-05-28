import {Spinner} from '@sanity/ui'
import React, {useEffect, useRef, useState} from 'react'

export interface DelayedSpinnerProps {
  delay?: number
  muted?: boolean
}

export interface DelayedSpinnerState {
  show?: boolean
}

export function DelayedSpinner(props: DelayedSpinnerProps) {
  const {delay = 500, muted} = props
  const timerRef = useRef<NodeJS.Timer | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Waits for X ms before showing a spinner
    timerRef.current = setTimeout(() => setVisible(true), delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [delay])

  return visible ? <Spinner muted={muted} /> : null
}
