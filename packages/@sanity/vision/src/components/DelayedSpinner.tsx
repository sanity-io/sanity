import {Spinner} from '@sanity/ui'
import {useEffect, useState} from 'react'

interface DelayedSpinnerProps {
  delay?: number
}

// Waits for X ms before showing a spinner
export function DelayedSpinner(props: DelayedSpinnerProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), props.delay || 500)
    return () => clearTimeout(timer)
  }, [props.delay])

  return show ? <Spinner muted size={4} /> : null
}
