import {StickyOverlay} from './StickyOverlay'
import React from 'react'
import {DISABLE_OVERLAY} from '../constants'
import {Tracker} from '../overlay-reporter'

interface Props {
  children: React.ReactNode
  margins: [number, number, number, number]
}

function OverlayEnabled(props: Props) {
  return (
    <Tracker component={StickyOverlay} componentProps={{margins: props.margins}}>
      {props.children}
    </Tracker>
  )
}

function OverlayDisabled(props: Props) {
  return props.children
}

export const Overlay = DISABLE_OVERLAY ? OverlayDisabled : OverlayEnabled
