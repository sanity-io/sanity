import * as React from 'react'
import VisibilitySensor from 'react-visibility-sensor'

export default function Presence(props) {
  return (
    <VisibilitySensor
      children={({isVisible, visibilityRect}) => {
        const {top, bottom} = visibilityRect
        const isBottom = top && !bottom
        if (isVisible === false) {
          console.log(`${props.title} is invisible at ${isBottom ? 'bottom' : 'top'}`)
        } else if (isVisible === true) {
          console.log(`${props.title} is visible`)
        }
        return (
          <div>
            {/* <pre>{JSON.stringify(props.presence, null, 2)}</pre> */}
            PRESENCE
          </div>
        )
      }}
    />
  )
}
