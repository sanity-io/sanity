import {motion, type VariantLabels, type Variants} from 'motion/react'
import {
  type ReactEventHandler,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefAttributes,
  ViewTransition,
} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {
  STUDIO_RESIZE_TRANSITION_TYPE,
  studioViewTransitionClass,
} from '../../core/viewTransitions/transitionTypes'

/** Switching the preview between the desktop and mobile viewports */
export const IFRAME_VIEWPORT_TRANSITION = 'sanity-iframe-viewport'

/*
 * Keyed by transition type, with `none` for every other type: a transition elsewhere in the studio
 * pictures the iframe with the rest of the page, unless it resizes the layout the iframe is in.
 */
const IFRAME_VIEWPORT = studioViewTransitionClass({
  default: 'none',
  [STUDIO_RESIZE_TRANSITION_TYPE]: 'auto',
})

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

  return (
    <>
      <ViewTransition default={IFRAME_VIEWPORT}>
        <IFrameElement
          style={style}
          animate={animate}
          initial={initial}
          onLoad={onLoad}
          ref={ref}
          src={src}
          variants={variants}
        />
      </ViewTransition>
      {preventClick && <IFrameOverlay />}
    </>
  )
}

const IFrameElement = motion.create(styled.iframe`
  box-shadow: 0 0 0 1px var(--card-border-color);
  border: 0;
  max-height: 100%;
  width: 100%;
`)

const IFrameOverlay = styled(Box)`
  position: absolute;
  inset: 0;
  background: transparent;
`
