/* eslint-disable react/no-multi-comp */
import {useId} from '@reach/auto-id'
import React from 'react'

import {FormFieldPresence} from '../types'
import {DISABLE_OVERLAY} from '../constants'
import {RegionReporter} from '../overlay-reporter'

type Props = {
  presence: FormFieldPresence[]
  maxAvatars: number
  component: React.ComponentType<{presence: FormFieldPresence[]}>
}

function RegionWithOverlay({presence, component, maxAvatars}: Props) {
  return <RegionReporter id={useId()} data={{presence, maxAvatars}} component={component} />
}

function RegionWithoutOverlay({presence, component: Component}: Props) {
  return <Component presence={presence} />
}

export const PresenceRegion = DISABLE_OVERLAY ? RegionWithoutOverlay : RegionWithOverlay
