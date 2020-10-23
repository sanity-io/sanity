import * as React from 'react'
import {
  ArrayDiff,
  ObjectDiff,
  Diff,
  DiffProps as GenericDiffProps,
  DiffComponent,
} from '@sanity/field/diff'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {GoogleMap} from '../map/Map'
import {Geopoint} from '../types'
import {GeopointMove} from './GeopointMove'
import styles from './GeopointFieldDiff.css'

export type DiffProps = GenericDiffProps<ArrayDiff<Geopoint>>

export const GeopointArrayDiff: DiffComponent<ArrayDiff<Geopoint>> = ({diff, schemaType}) => {
  return (
    <div className={styles.root}>
      <GoogleMapsLoadProxy>
        {(api) => <GeopointDiff api={api} diff={diff} schemaType={schemaType} />}
      </GoogleMapsLoadProxy>
    </div>
  )
}

function GeopointDiff({api, diff}: DiffProps & {api: typeof window.google.maps}) {
  const fromValue = (diff.fromValue || []).filter(hasCoordinates)
  const toValue = (diff.toValue || []).filter(hasCoordinates)
  if (fromValue.length === 0 && toValue.length === 0) {
    return null
  }

  const bounds = getBounds(fromValue, toValue, api)
  return (
    <GoogleMap
      api={api}
      location={bounds.getCenter().toJSON()}
      mapTypeControl={false}
      controlSize={20}
      bounds={bounds}
    >
      {(map) => (
        <>
          {diff.items.map(({toIndex, diff: pointDiff}) => {
            if (!isChangeDiff(pointDiff)) {
              return null
            }

            return (
              <GeopointMove
                key={toIndex}
                api={api}
                map={map}
                diff={pointDiff}
                label={`${toIndex}`}
              />
            )
          })}
        </>
      )}
    </GoogleMap>
  )
}

function isChangeDiff(diff: Diff): diff is ObjectDiff<Geopoint> {
  return diff.action !== 'unchanged' && diff.type === 'object'
}

function hasCoordinates(point: Partial<Geopoint>): point is Geopoint {
  return typeof point.lat === 'number' && typeof point.lng === 'number'
}

function getBounds(
  fromValue: google.maps.LatLngLiteral[] | null | undefined,
  toValue: google.maps.LatLngLiteral[] | null | undefined,
  api: typeof window.google.maps
): google.maps.LatLngBounds {
  const bounds = new api.LatLngBounds()
  const points = [...(fromValue || []), ...(toValue || [])]
  points.forEach((point) => bounds.extend(point))
  return bounds
}
