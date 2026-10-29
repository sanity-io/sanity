import {Card} from '@sanity/ui'
import {type CSSProperties, type Ref, type RefAttributes} from 'react'

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

export function Iframe(props: IframeProps & RefAttributes<HTMLIFrameElement>) {
  const {ref: forwardedRef, src, hidden} = props
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
}
