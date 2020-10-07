import * as React from 'react'
import {useUserColor} from '@sanity/base/user-color'
import {ObjectDiff} from '@sanity/field/diff'
import {Marker} from '../map/Marker'
import {Arrow} from '../map/Arrow'
import {Geopoint} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  diff: ObjectDiff<Geopoint>
  label?: string
}

export function GeopointMove({diff, api, map, label}: Props) {
  const {fromValue: from, toValue: to} = diff
  const annotation = diff.isChanged ? diff.annotation : undefined
  const userColor = useUserColor(annotation ? annotation.author : null) || undefined
  const fromRef = React.useRef<google.maps.Marker>()
  const toRef = React.useRef<google.maps.Marker>()

  return (
    <>
      {from && (
        <Marker
          api={api}
          map={map}
          position={from}
          zIndex={0}
          opacity={0.55}
          markerRef={fromRef}
          color={userColor}
        />
      )}
      {from && to && <Arrow api={api} map={map} from={from} to={to} zIndex={1} color={userColor} />}
      {to && (
        <Marker
          api={api}
          map={map}
          position={to}
          zIndex={2}
          markerRef={toRef}
          label={label}
          color={userColor}
        />
      )}
    </>
  )
}
