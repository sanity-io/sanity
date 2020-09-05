import React from 'react'
import {DISABLE_OVERLAY} from '../constants'
import {Tracker} from '../overlay-reporter'
import {StickyOverlay} from './StickyOverlay'

interface Props {
  children: React.ReactNode
  margins: [number, number, number, number]
}

function OverlayEnabled(props: Props) {
  return (
    <Tracker component={StickyOverlay as any} componentProps={{margins: props.margins}}>
      {props.children}
    </Tracker>
  )
}

function OverlayDisabled(props: Props) {
  return props.children
}

export const PresenceOverlay = DISABLE_OVERLAY ? OverlayDisabled : OverlayEnabled
