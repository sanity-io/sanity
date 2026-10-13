import {useLayoutEffect, useRef} from 'react'
import {Flex} from 'ui5'

import {measureIntersection, reachesThreshold} from './measureIntersection'

/**
 * The part of an `IntersectionObserverEntry` the collapse menus read. `isIntersecting` is whether
 * the intersection reaches the smallest threshold in the observer options, from the mount
 * measurement and the observer's entries alike.
 */
export type ObservedIntersection = Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>

interface ObserveElementProps {
  children: React.JSX.Element
  className?: string
  options?: IntersectionObserverInit
  /**
   * Called with the current intersection of the wrapping `Flex` with `options.root`: once from
   * the layout effect that mounts the observer, measured synchronously so the first paint can
   * account for it, and then whenever the observer reports a change.
   */
  onIntersectionChange: (entries: ObservedIntersection[]) => void
}

export function ObserveElement(props: ObserveElementProps) {
  const {onIntersectionChange, children, options, ...rest} = props
  const ref = useRef<HTMLSpanElement>(null)

  // A layout effect, so the observer exists before the browser paints: a passive effect would
  // run after the paint, and the state it feeds would miss another frame.
  useLayoutEffect(() => {
    const target = ref.current?.closest('[data-ui="Flex"]')
    if (!target) return undefined

    // The observer's entries go through the same threshold test as the measurement below, so the
    // two never disagree about an element that overlaps the root without reaching the threshold
    const io = new IntersectionObserver(
      (entries) =>
        onIntersectionChange(
          entries.map((entry) => ({
            isIntersecting: reachesThreshold(entry, options),
            target: entry.target,
          })),
        ),
      options,
    )
    io.observe(target)
    // The observer delivers its first entry in a task after the next paint. Reporting the
    // current intersection here lets a parent set state before that paint, so what it renders
    // from these entries is in the first frame instead of popping in a frame later.
    onIntersectionChange([{isIntersecting: measureIntersection(target, options), target}])

    return () => {
      io.unobserve(target)
      io.disconnect()
    }
  }, [onIntersectionChange, options])

  return (
    <Flex {...rest}>
      {children}
      <span hidden ref={ref} />
    </Flex>
  )
}
