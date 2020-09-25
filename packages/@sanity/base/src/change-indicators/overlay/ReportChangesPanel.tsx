import React from 'react'
import {useReporter} from '../'

export function ReportChangesPanel(props: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null)
  useReporter(
    'changesPanel',
    () => ({element: ref.current!}),
    (a, b) => a.element === b.element
  )
  return (
    <div ref={ref} className={props.className}>
      {props.children}
    </div>
  )
}
