import {motion} from 'motion/react'
import {type ReactNode, useCallback, useLayoutEffect, useRef, useState} from 'react'

/**
 * Animates width changes when label text changes, e.g. when switching perspectives or variants.
 *
 * @internal
 */
export function AnimatedTextWidth({children, text}: {children: ReactNode; text: string}) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [containerWidth, setContainerWidth] = useState<null | number>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useLayoutEffect(() => {
    if (!textRef.current) return
    const newWidth = textRef.current.offsetWidth
    setContainerWidth(newWidth)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [text])

  const onAnimationStart = useCallback(() => {
    setIsAnimating(true)
  }, [])
  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <motion.div
      style={{
        display: 'inline-block',
        // Top alignment, not the default baseline. An inline-block whose overflow is
        // anything but `visible` reports its bottom edge as its baseline, and the
        // button's line box grows by that shift for the whole animation.
        verticalAlign: 'top',
        width: containerWidth === null ? 'auto' : containerWidth,
      }}
      animate={{width: containerWidth || 'auto'}}
      transition={{type: 'spring', bounce: 0, duration: 0.3}}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
    >
      {/* Clip on this block, not on the inline-block above, so the baseline stays put. */}
      <div style={{overflow: isAnimating ? 'hidden' : 'visible'}}>
        <span
          ref={textRef}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            verticalAlign: 'top',
          }}
        >
          {children}
        </span>
      </div>
    </motion.div>
  )
}
