import {type ColorTints} from '@sanity/color'
import {getTheme_v2} from '@sanity/ui/theme'
import {lazy, Suspense, useCallback, useEffect, useId, useMemo, useReducer, useState} from 'react'
import {css, styled} from 'styled-components'

import {usePresenceReporter} from '../../../../presence/overlay/tracker'
import {type FieldPresenceData, type FormNodePresence} from '../../../../presence/types'
import {useUserColor} from '../../../../user-color/hooks'
import {DOT_SIZE} from './constants'

const loadUserPresenceCursorLabel = () => import('./UserPresenceCursorLabel')
const UserPresenceCursorLabel = lazy(loadUserPresenceCursorLabel)

const CursorLine = styled.span<{$tints: ColorTints}>(({theme, $tints}) => {
  const isDark = getTheme_v2(theme)?.color._dark
  const bg = $tints[isDark ? 400 : 500].hex
  const fg = $tints[isDark ? 900 : 50].hex

  return css`
    --presence-cursor-bg: ${bg};
    --presence-cursor-fg: ${fg};

    border-left: 1px solid transparent;
    border-color: var(--presence-cursor-bg);
    margin-left: -1px;
    position: relative;
    word-break: normal;
    white-space: normal;
    mix-blend-mode: unset;
    pointer-events: none;
  `
})

const CursorDot = styled.div`
  background-color: var(--presence-cursor-bg);
  border-radius: 50%;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  position: absolute;
  top: -${DOT_SIZE - 1}px;
  left: -0.5px;
  transform: translateX(-50%);
  mix-blend-mode: unset;
  z-index: 0;
  pointer-events: all;

  // Increase the hit area of the cursor dot
  &:before {
    content: '';
    position: absolute;
    top: -${DOT_SIZE / 2}px;
    left: 50%;
    transform: translateX(-50%);
    width: ${DOT_SIZE * 2}px;
    height: ${DOT_SIZE * 3}px;
    opacity: 0.5;
  }
`

interface UserPresenceCursorProps {
  children?: React.ReactNode
  presence: FormNodePresence
}

/** The nearest ancestor that scrolls vertically, i.e. the editor's scroll container */
function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null
  while (node) {
    const {overflowY} = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node
    }
    node = node.parentElement
  }
  return null
}

const increment = (count: number) => count + 1

export function UserPresenceCursor(props: UserPresenceCursorProps): React.JSX.Element {
  const {children, presence} = props
  const {user} = presence
  const {tints} = useUserColor(user.id)
  const [hovered, setHovered] = useState<boolean>(false)
  const [element, setElement] = useState<HTMLSpanElement | null>(null)
  const scrollParent = useMemo(() => getScrollParent(element), [element])

  // Register the cursor with the presence overlay, which shows an avatar pointing towards the
  // cursor when it is out of view: at the edge of the editor's scroll container while the cursor
  // is hidden by the editor's own scrolling, or in the overlay's docks when the editor itself is
  // scrolled out of view. `inline` tells the overlay to render nothing while the cursor is visible.
  const reporterId = useId()
  const reporterGetSnapshot = useCallback(
    (): FieldPresenceData => ({
      element,
      presence: [presence],
      maxAvatars: 1,
      inline: true,
      clipElement: scrollParent,
    }),
    [element, presence, scrollParent],
  )
  usePresenceReporter(element ? reporterId : null, reporterGetSnapshot)

  // The overlay only re-measures when a reporter publishes, and scrolling the editor moves the
  // cursor relative to the overlay without re-rendering anything, so publish on scroll.
  const [, publish] = useReducer(increment, 0)
  useEffect(() => {
    if (!scrollParent) return undefined
    scrollParent.addEventListener('scroll', publish, {passive: true})
    return () => scrollParent.removeEventListener('scroll', publish)
  }, [scrollParent])

  useEffect(() => {
    void loadUserPresenceCursorLabel()
  }, [])

  // The label stays mounted once shown, so it can animate out
  const [hasHovered, setHasHovered] = useState(false)
  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    setHasHovered(true)
  }, [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const testId = useMemo(
    () => `presence-cursor-${user.displayName?.split(' ').join('-')}`,
    [user.displayName],
  )

  return (
    <>
      <CursorLine
        $tints={tints}
        contentEditable={false}
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={setElement}
      >
        {hasHovered && (
          <Suspense fallback={null}>
            <UserPresenceCursorLabel displayName={user.displayName} visible={hovered} />
          </Suspense>
        )}

        <CursorDot />
      </CursorLine>
      {children}
    </>
  )
}
