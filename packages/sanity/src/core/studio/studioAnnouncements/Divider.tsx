import {Box} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
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
/**
 * A divider that fades when reaching the top of the parent.
 */
export function Divider(props: {parentRef: React.RefObject<HTMLDivElement>}): JSX.Element {
  const {parentRef} = props
  const itemRef = useRef<HTMLHRElement | null>(null)
  const [show, setShow] = useState(true)

  const handleScrollChange = useCallback(() => {
    const itemTop = itemRef.current?.getBoundingClientRect().top
    const parentTop = parentRef.current?.getBoundingClientRect().top
    // If the item is between -6px and 80px from the top of the parent, show it
    if (typeof itemTop !== 'number' || typeof parentTop !== 'number') return
    setShow(itemTop >= parentTop + 60)
  }, [parentRef])

  useEffect(() => {
    const parent = parentRef.current
    if (parent) {
      parent.addEventListener('scroll', handleScrollChange)
    }
    return () => {
      if (parent) {
        parent.removeEventListener('scroll', handleScrollChange)
      }
    }
  }, [itemRef, handleScrollChange, parentRef])

  return (
    <Box paddingBottom={4}>
      <Box paddingY={3} paddingX={3}>
        <Hr ref={itemRef} $show={show} />
      </Box>
    </Box>
  )
}
