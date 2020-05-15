import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import React from 'react'
import {Tracker} from '@sanity/overlayer'
import {DISABLE_OVERLAY} from '../constants'

interface Props {
  children: React.ReactNode
  margins: [number, number, number, number]
}

function OverlayEnabled(props: Props) {
  return (
    <Tracker component={StickyOverlayRenderer} componentProps={{margins: props.margins}}>
      {props.children}
    </Tracker>
  )
}

function OverlayDisabled(props: Props) {
  return props.children
}

export const Overlay = DISABLE_OVERLAY ? OverlayDisabled : OverlayEnabled
