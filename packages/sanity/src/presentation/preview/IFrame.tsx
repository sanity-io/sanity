import {Box} from '@sanity/ui'
import {motion, type VariantLabels, type Variants} from 'motion/react'
import {forwardRef, type ReactEventHandler, useEffect, useImperativeHandle, useRef} from 'react'

import {iframeElement, iframeOverlay} from './IFrame.css'
import {useId} from '../useId'

interface IFrameProps {
  animate: VariantLabels
  initial: VariantLabels
  onLoad: ReactEventHandler<HTMLIFrameElement>
  preventClick: boolean
  src: string
  variants: Variants
  style: React.CSSProperties
}

const MotionIframe = motion.create('iframe')

export const IFrame = forwardRef<HTMLIFrameElement, IFrameProps>(
  function IFrame(props, forwardedRef) {
    const {animate, initial, onLoad, preventClick, src, variants, style} = props

    const ref = useRef<HTMLIFrameElement | null>(null)
    // Forward the iframe ref to the parent component
    useImperativeHandle<HTMLIFrameElement | null, HTMLIFrameElement | null>(
      forwardedRef,
      () => ref.current,
    )

    /**
     * Ensure that clicking outside of menus and dialogs will close as focus shifts to the iframe
     */

    useEffect(() => {
      if (!ref.current) {
        return undefined
      }
      const instance = ref.current
      function handleBlur() {
        if (instance !== document.activeElement) {
          return
        }

        instance.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}))
      }
      window.addEventListener('blur', handleBlur)
      return () => {
        window.removeEventListener('blur', handleBlur)
      }
    }, [])

    const viewTransitionName = useId()

    return (
      <>
        <MotionIframe
          className={iframeElement}
          style={{
            ...style,
            viewTransitionName,
          }}
          animate={animate}
          initial={initial}
          onLoad={onLoad}
          ref={ref}
          src={src}
          variants={variants}
        />
        {preventClick && <Box className={iframeOverlay} />}
      </>
    )
  },
)
