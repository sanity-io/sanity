/* eslint-disable react/no-multi-comp */
import {useId} from '@reach/auto-id'
import React from 'react'

import {FormFieldPresence} from '../types'
import {RegionReporter} from '../overlay-reporter'
import {DISABLE_OVERLAY} from '../constants'
import {FieldPresenceProps} from '../FieldPresence'

type PresenceRegionProps = {
  presence: FormFieldPresence[]
  maxAvatars: number
  component: React.ComponentType<FieldPresenceProps>
}

function RegionWithOverlay({component, ...rest}: PresenceRegionProps) {
  return <RegionReporter id={useId() || ''} data={rest} component={component as any} />
}

function RegionWithoutOverlay({component: Component, ...rest}: PresenceRegionProps) {
  return <Component {...rest} />
}

export const PresenceRegion = DISABLE_OVERLAY ? RegionWithoutOverlay : RegionWithOverlay
