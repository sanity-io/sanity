import {Card} from '@sanity/ui'
import {type CSSProperties, forwardRef, type Ref} from 'react'

export interface IframeProps {
  src: string
  hidden?: boolean
}

const defaultStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  flexDirection: 'column',
  overflow: 'hidden',
}

const hiddenStyle: CSSProperties = {
  display: 'none',
}

export const Iframe = forwardRef(function Iframe(
  props: IframeProps,
  forwardedRef: Ref<HTMLIFrameElement>,
) {
  const {src, hidden} = props
  return (
    <Card style={hidden ? hiddenStyle : defaultStyle}>
      <iframe
        ref={forwardedRef}
        src={src}
        style={{
          overflow: 'hidden',
          flexGrow: 1,
          border: 'none',
          margin: 0,
          padding: 0,
          height: '100%',
          width: '100%',
        }}
      />
    </Card>
  )
})
