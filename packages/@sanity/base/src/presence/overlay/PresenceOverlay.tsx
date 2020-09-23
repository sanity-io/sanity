import React from 'react'
import {DISABLE_OVERLAY} from '../constants'
import {Tracker} from './tracker'
import {StickyOverlay} from './StickyOverlay'

interface Props {
  children: React.ReactNode
  margins?: [number, number, number, number]
}

function OverlayEnabled({children, margins}: Props) {
  return (
    <Tracker>
      <StickyOverlay margins={margins}>{children}</StickyOverlay>
    </Tracker>
  )
}

function OverlayDisabled(props: Props) {
  return props.children as JSX.Element
}

export const PresenceOverlay = DISABLE_OVERLAY ? OverlayDisabled : OverlayEnabled
