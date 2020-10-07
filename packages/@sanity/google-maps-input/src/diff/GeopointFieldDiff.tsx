import * as React from 'react'
import {
  DiffComponent,
  ObjectDiff,
  DiffProps as GenericDiffProps,
  DiffTooltip,
  getAnnotationAtPath
} from '@sanity/field/diff'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {GoogleMap} from '../map/Map'
import {Geopoint} from '../types'
import {GeopointMove} from './GeopointMove'
import styles from './GeopointFieldDiff.css'

export type DiffProps = GenericDiffProps<ObjectDiff<Geopoint>>

export const GeopointFieldDiff: DiffComponent<ObjectDiff<Geopoint>> = ({diff, schemaType}) => {
  return (
    <div className={styles.root}>
      <GoogleMapsLoadProxy>
        {api => <GeopointDiff api={api} diff={diff} schemaType={schemaType} />}
      </GoogleMapsLoadProxy>
    </div>
  )
}

function GeopointDiff({api, diff}: DiffProps & {api: typeof window.google.maps}) {
  const {fromValue, toValue} = diff
  const annotation =
    getAnnotationAtPath(diff, ['lat']) ||
    getAnnotationAtPath(diff, ['lng']) ||
    getAnnotationAtPath(diff, [])

  const center = getCenter(diff, api)
  const bounds = fromValue && toValue ? getBounds(fromValue, toValue, api) : undefined

  return (
    <DiffTooltip annotations={annotation ? [annotation] : []} description={getAction(diff)}>
      <div>
        <GoogleMap
          api={api}
          location={center}
          mapTypeControl={false}
          controlSize={20}
          bounds={bounds}
          scrollWheel={false}
        >
          {map => <GeopointMove api={api} map={map} diff={diff} />}
        </GoogleMap>
      </div>
    </DiffTooltip>
  )
}

function getBounds(
  fromValue: google.maps.LatLngLiteral,
  toValue: google.maps.LatLngLiteral,
  api: typeof window.google.maps
): google.maps.LatLngBounds {
  return new api.LatLngBounds().extend(fromValue).extend(toValue)
}

function getCenter(
  diff: DiffProps['diff'],
  api: typeof window.google.maps
): google.maps.LatLngLiteral {
  const {fromValue, toValue} = diff
  if (fromValue && toValue) {
    return getBounds(fromValue, toValue, api)
      .getCenter()
      .toJSON()
  }

  if (fromValue) {
    return fromValue
  }

  if (toValue) {
    return toValue
  }

  throw new Error('Neither a from or a to value present')
}

function getAction(diff: ObjectDiff<Geopoint>) {
  const {fromValue, toValue} = diff
  if (fromValue && toValue) {
    return 'Moved'
  } else if (fromValue) {
    return 'Removed'
  } else if (toValue) {
    return 'Added'
  }

  return 'Unchanged'
}
