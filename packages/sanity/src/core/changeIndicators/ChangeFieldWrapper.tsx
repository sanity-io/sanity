import {type Path} from '@sanity/types'
import {Text} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import deepCompare from 'react-fast-compare'
import {ReviewChangesContext} from 'sanity/_singletons'

import {useZIndex} from '../components/zOffsets/useZIndex'
import {pathToString} from '../field/paths/helpers'
import {DEBUG} from './constants'
import {useChangeIndicatorsReporter} from './tracker'

/**
 * This is used to draw the bar that wraps the diff components in the changes panel
 *
 * @internal
 */
export const ChangeFieldWrapper = (props: {
  path: Path
  children: ReactNode
  hasRevertHover: boolean
}) => {
  const {path, hasRevertHover} = props
  const {onSetFocus} = useContext(ReviewChangesContext)
  const zIndex = useZIndex()
  const [hasHover, setHover] = useState(false)

  const onMouseEnter = useCallback(() => {
    setHover(true)
  }, [])

  const onMouseLeave = useCallback(() => {
    setHover(false)
  }, [])

  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const reporterId = useMemo(
    () => (element ? `change-${PathUtils.toString(path)}` : null),
    [element, path],
  )
  const reporterGetSnapshot = useCallback(
    () => ({
      element,
      path,
      isChanged: true,
      hasFocus: false,
      hasHover,
      zIndex: Array.isArray(zIndex.popover) ? zIndex.popover[0] : zIndex.popover,
      hasRevertHover,
    }),
    [element, path, hasHover, zIndex.popover, hasRevertHover],
  )
  useChangeIndicatorsReporter(
    reporterId,
    reporterGetSnapshot,
    // note: deepCompare should be ok here since we're not comparing deep values
    deepCompare,
  )

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      setFocusWithStopPropagation(event, onSetFocus, path)
    },
    [onSetFocus, path],
  )

  return (
    <div
      ref={setElement}
      onClick={handleClick}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      {DEBUG && (
        <Text weight="medium" size={1}>
          {pathToString(path)}
        </Text>
      )}
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
