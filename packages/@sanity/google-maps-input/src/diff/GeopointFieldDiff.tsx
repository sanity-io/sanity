import * as React from 'react'
import {ObjectDiff} from '@sanity/diff'
import {GeopointSchemaType, Geopoint, Annotation} from '../types'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {GoogleMap} from '../map/Map'
import {GeopointMove} from './GeopointMove'
import styles from './GeopointFieldDiff.css'

export interface DiffProps {
  diff: ObjectDiff<Annotation, Geopoint>
  schemaType: GeopointSchemaType
}

export const GeopointFieldDiff: React.ComponentType<DiffProps> = ({diff, schemaType}) => {
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
  const center = getCenter(diff, api)
  const bounds = fromValue && toValue ? getBounds(fromValue, toValue, api) : undefined

  return (
    <GoogleMap api={api} location={center} mapTypeControl={false} controlSize={20} bounds={bounds}>
      {map => <GeopointMove api={api} map={map} diff={diff} />}
    </GoogleMap>
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
