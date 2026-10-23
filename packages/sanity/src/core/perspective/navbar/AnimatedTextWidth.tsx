import {type ReactNode, type TransitionEvent, useLayoutEffect, useRef, useState} from 'react'

import {root, text as textClassName} from './AnimatedTextWidth.css'

function isOwnWidthTransition(event: TransitionEvent<HTMLDivElement>) {
  return event.target === event.currentTarget && event.propertyName === 'width'
}

/**
 * Animates width changes when label text changes, e.g. when switching perspectives or variants.
 *
 * @internal
 */
export function AnimatedTextWidth({children, text}: {children: ReactNode; text: string}) {
  const textRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<null | number>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useLayoutEffect(() => {
    if (!textRef.current) return
    const newWidth = textRef.current.offsetWidth
    setContainerWidth(newWidth)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [text])

  const handleTransitionRun = (event: TransitionEvent<HTMLDivElement>) => {
    if (isOwnWidthTransition(event)) setIsAnimating(true)
  }
  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (isOwnWidthTransition(event)) setIsAnimating(false)
  }

  return (
    <div
      className={root}
      data-animating={isAnimating ? '' : undefined}
      onTransitionCancel={handleTransitionEnd}
      onTransitionEnd={handleTransitionEnd}
      onTransitionRun={handleTransitionRun}
      style={{width: containerWidth === null ? 'auto' : containerWidth}}
    >
      <div className={textClassName} ref={textRef}>
        {children}
      </div>
    </div>
  )
}
