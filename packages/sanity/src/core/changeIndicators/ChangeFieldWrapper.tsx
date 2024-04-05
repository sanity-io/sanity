import {type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {type ReactNode, type SyntheticEvent, useCallback, useContext, useRef, useState} from 'react'
import deepCompare from 'react-fast-compare'
import {ConnectorContext} from 'sanity/_singletons'

import {useReporter} from './tracker'

/**
 * This is used to draw the bar that wraps the diff components in the changes panel
 *
 * @internal
 */
export const ChangeFieldWrapper = (props: {path: Path; children: ReactNode; hasHover: boolean}) => {
  const ref = useRef<HTMLDivElement>(null)
  const {onSetFocus} = useContext(ConnectorContext)
  const [isHover, setHover] = useState(false)

  const onMouseEnter = useCallback(() => {
    setHover(true)
  }, [])

  const onMouseLeave = useCallback(() => {
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
  event: SyntheticEvent,
  onSetFocus: (toPath: Path) => void,
  path: Path,
): void {
  event.stopPropagation()
  onSetFocus(path)
}
