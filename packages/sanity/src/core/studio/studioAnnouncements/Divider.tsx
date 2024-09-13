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
  parentRef: React.RefObject<HTMLDivElement>
}

/**
 * A divider that fades when reaching the top of the parent.
 */
export function Divider({parentRef}: DividerProps): JSX.Element {
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
      {root: parent, threshold: 0, rootMargin: '-60px 0px 0px 0px'},
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
