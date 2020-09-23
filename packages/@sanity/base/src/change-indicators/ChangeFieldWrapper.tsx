import * as PathUtils from '@sanity/util/paths'
import React from 'react'
import {useReporter} from './tracker'
import {Path} from '@sanity/types'

/**
 * This is used to draw the bar that wraps the diff components in the changes panel
 */
export const ChangeFieldWrapper = (props: {
  path: Path
  children: React.ReactNode
  hasHover: boolean
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const [isHover, setHover] = React.useState(false)
  const onMouseEnter = React.useCallback(() => {
    setHover(true)
  }, [])
  const onMouseLeave = React.useCallback(() => {
    setHover(false)
  }, [])
  useReporter(`change-${PathUtils.toString(props.path)}`, () => ({
    element: ref.current!,
    path: props.path,
    isChanged: true,
    hasFocus: false,
    hasHover: isHover,
    hasRevertHover: props.hasHover
  }))
  return (
    <div ref={ref} onMouseLeave={onMouseLeave} onMouseEnter={onMouseEnter}>
      {props.children}
    </div>
  )
}
