import React from 'react'
import {DISABLE_OVERLAY} from '../constants'
import {Tracker} from './tracker'
import {StickyOverlay} from './StickyOverlay'

export interface PresenceOverlayProps {
  children: React.ReactNode
  margins?: [number, number, number, number]
}

const DEFAULT_MARGINS: [number, number, number, number] = [0, 0, 0, 0]

function OverlayEnabled({children, margins}: PresenceOverlayProps) {
  return (
    <Tracker>
      <StickyOverlay margins={margins || DEFAULT_MARGINS}>{children}</StickyOverlay>
    </Tracker>
  )
}

export function OverlayDisabled(props: PresenceOverlayProps) {
  return props.children as JSX.Element
}

export const PresenceOverlay = DISABLE_OVERLAY ? OverlayDisabled : OverlayEnabled
