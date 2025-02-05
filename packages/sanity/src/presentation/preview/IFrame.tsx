import {Box} from '@sanity/ui'
import {motion, type VariantLabels, type Variants} from 'framer-motion'
import {forwardRef, type ReactEventHandler, useId} from 'react'
import {styled} from 'styled-components'

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

interface IFrameProps {
  animate: VariantLabels
  initial: VariantLabels
  onLoad: ReactEventHandler<HTMLIFrameElement>
  preventClick: boolean
  src: string
  variants: Variants
  style: React.CSSProperties
}

export const IFrame = forwardRef<HTMLIFrameElement, IFrameProps>(function IFrame(props, ref) {
  const {animate, initial, onLoad, preventClick, src, variants, style} = props
  const id = useId()

  return (
    <>
      <IFrameElement
        style={{
          ...style,
          // useId() guarantees that the ID will be unique, even if we add support for multiple iframe instances,
          // while `view-transition-class: presentation-tool-iframe` provides userland a way to customize the transition with CSS if they wish
          viewTransitionName: `presentation-tool-iframe-${id.replace(/[^a-zA-Z0-9-_]/g, '_')}`,
        }}
        animate={animate}
        initial={initial}
        onLoad={onLoad}
        ref={ref}
        src={src}
        variants={variants}
      />
      {preventClick && <IFrameOverlay />}
    </>
  )
})
