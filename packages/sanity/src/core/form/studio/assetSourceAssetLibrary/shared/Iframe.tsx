import {Card} from '@sanity/ui'
import {forwardRef, type Ref} from 'react'

export interface IframeProps {
  src: string
}

export const Iframe = forwardRef(function Iframe(
  props: IframeProps,
  forwardedRef: Ref<HTMLIFrameElement>,
) {
  const {src} = props
  return (
    <Card
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
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
