import {motion, type VariantLabels, type Variants} from 'motion/react'
import {
  type ReactEventHandler,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefAttributes,
} from 'react'
import {createGlobalStyle, styled} from 'styled-components'
import {Box} from 'ui5'

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
      <IFrameElement
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
      {preventClick && <IFrameOverlay />}
      <GlobalViewTransition />
    </>
  )
}

const IFrameElement = motion.create(styled.iframe`
  box-shadow: 0 0 0 1px var(--card-border-color);
  border: 0;
  max-height: 100%;
  width: 100%;
  view-transition-class: presentation-tool-iframe;
`)

const IFrameOverlay = styled(Box)`
  position: absolute;
  inset: 0;
  background: transparent;
`

const GlobalViewTransition = createGlobalStyle`
html:active-view-transition-type(sanity-iframe-viewport) {
  view-transition-name: none;
  &::view-transition {
    pointer-events: none;
  }
  /* &::view-transition-old(root) {
    display: none;
  }
  &::view-transition-new(root) {
    animation: none;
  } */
}
`
