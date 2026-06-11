import {motion} from 'motion/react'
import {type ReactNode, useCallback, useLayoutEffect, useRef, useState} from 'react'

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
        width: containerWidth === null ? 'auto' : containerWidth,
        overflow: isAnimating ? 'hidden' : 'visible',
      }}
      animate={{width: containerWidth || 'auto'}}
      transition={{type: 'spring', bounce: 0, duration: 0.3}}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
    >
      <div
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
