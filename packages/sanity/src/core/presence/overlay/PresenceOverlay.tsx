import {type ReactNode} from 'react'

import {StickyOverlay} from './StickyOverlay'
import {PresenceTracker} from './tracker'

/** @internal */
export interface PresenceOverlayProps {
  children: ReactNode
  margins?: [number, number, number, number]
}

const DEFAULT_MARGINS: [number, number, number, number] = [0, 0, 0, 0]

/** @internal */
export function PresenceOverlay({children, margins}: PresenceOverlayProps) {
  return (
    <PresenceTracker>
      <StickyOverlay margins={margins || DEFAULT_MARGINS}>{children}</StickyOverlay>
    </PresenceTracker>
  )
}
