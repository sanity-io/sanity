/* eslint-disable react/no-multi-comp */
import {useId} from '@reach/auto-id'
import React from 'react'
import {RegionReporter} from '@sanity/overlayer'
import {FieldPresence} from '../types'
import {DISABLE_OVERLAY} from '../constants'

type Props = {
  presence: FieldPresence[]
  component: React.ComponentType<{presence: FieldPresence[]}>
}

function RegionWithOverlay({presence, component}: Props) {
  return <RegionReporter id={useId()} data={{presence}} component={component} />
}

function RegionWithoutOverlay({presence, component: Component}: Props) {
  return <Component presence={presence} />
}

export const PresenceRegion = DISABLE_OVERLAY ? RegionWithoutOverlay : RegionWithOverlay
