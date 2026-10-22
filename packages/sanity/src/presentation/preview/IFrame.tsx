import {motion, type VariantLabels, type Variants} from 'motion/react'
import {
  type ReactEventHandler,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefAttributes,
} from 'react'
import {Box} from 'ui5'

import {useId} from '../useId'
import {iframeElement, iframeOverlay} from './IFrame.css'

interface IFrameProps {
  animate: VariantLabels
  initial: VariantLabels
  onLoad: ReactEventHandler<HTMLIFrameElement>
  preventClick: boolean
  src: string
  variants: Variants
  style: React.CSSProperties
}

export function IFrame(props: IFrameProps & RefAttributes<HTMLIFrameElement>) {
  const {ref: forwardedRef, animate, initial, onLoad, preventClick, src, variants, style} = props

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
      <motion.iframe
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
}
