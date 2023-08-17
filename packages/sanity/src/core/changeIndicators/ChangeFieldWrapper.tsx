import * as PathUtils from '@sanity/util/paths'
import React, {SyntheticEvent, useCallback} from 'react'
import {Path} from '@sanity/types'
import deepCompare from 'react-fast-compare'
import {useReporter} from './tracker'
import {ConnectorContext} from './ConnectorContext'

/**
 * This is used to draw the bar that wraps the diff components in the changes panel
 *
 * @internal
 */
export const ChangeFieldWrapper = (props: {
  path: Path
  children: React.ReactNode
  hasHover: boolean
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const {onSetFocus} = React.useContext(ConnectorContext)
  const [isHover, setHover] = React.useState(false)

  const onMouseEnter = React.useCallback(() => {
    setHover(true)
  }, [])

  const onMouseLeave = React.useCallback(() => {
    setHover(false)
  }, [])

  useReporter(
    `change-${PathUtils.toString(props.path)}`,
    () => ({
      element: ref.current!,
      path: props.path,
      isChanged: true,
      hasFocus: false,
      hasHover: isHover,
      hasRevertHover: props.hasHover,
    }),
    // note: deepCompare should be ok here since we're not comparing deep values
    deepCompare,
  )

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      setFocusWithStopPropagation(event, onSetFocus, props.path)
    },
    [onSetFocus, props.path],
  )

  return (
    <div ref={ref} onClick={handleClick} onMouseLeave={onMouseLeave} onMouseEnter={onMouseEnter}>
      {props.children}
    </div>
  )
}

// Stop the propagation here, or it will trigger the parent diff component's onClick.
function setFocusWithStopPropagation(
  event: React.SyntheticEvent,
  onSetFocus: (toPath: Path) => void,
  path: Path,
): void {
  event.stopPropagation()
  onSetFocus(path)
}
