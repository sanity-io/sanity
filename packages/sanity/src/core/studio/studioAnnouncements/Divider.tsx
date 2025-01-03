import {Box} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

const Hr = styled.hr<{$show: boolean}>`
  height: 1px;
  background: var(--card-border-color);
  width: 100%;
  opacity: ${({$show}) => ($show ? 1 : 0)};
  transition: opacity 0.3s ease;
  margin: 0;
  border: none;
`

interface DividerProps {
  parentRef: React.RefObject<HTMLDivElement | null>
}

/**
 * This is the threshold for the divider to start fading
 * uses a negative value to start fading before reaching the top
 * of the parent.
 * We want to fade out the divider so it doesn't overlap with the close icon when reaching the top.
 * It's the sum of the title height (48px) and the divider padding top (12px)
 */
const DIVIDER_FADE_THRESHOLD = '-60px 0px 0px 0px'

/**
 * A divider that fades when reaching the top of the parent.
 */
export function Divider({parentRef}: DividerProps): React.JSX.Element {
  const itemRef = useRef<HTMLHRElement | null>(null)
  const [show, setShow] = useState(true)

  useEffect(() => {
    const item = itemRef.current
    const parent = parentRef.current

    if (!item || !parent) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShow(entry.isIntersecting)
      },
      {root: parent, threshold: 0, rootMargin: DIVIDER_FADE_THRESHOLD},
    )

    observer.observe(item)

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect()
    }
  }, [parentRef])

  return (
    <Box paddingBottom={4}>
      <Box paddingY={3} paddingX={3}>
        <Hr ref={itemRef} $show={show} />
      </Box>
    </Box>
  )
}
