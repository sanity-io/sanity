import * as React from 'react'
import {ArrayDiff} from '@sanity/diff'
import {GeopointSchemaType, Geopoint, Annotation} from '../types'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {GoogleMap} from '../map/Map'
import {GeopointMove} from './GeopointMove'
import styles from './GeopointFieldDiff.css'

export interface DiffProps {
  diff: ArrayDiff<Annotation, Geopoint>
  schemaType: GeopointSchemaType
}

export const GeopointArrayDiff: React.ComponentType<DiffProps> = ({diff, schemaType}) => {
  return (
    <div className={styles.root}>
      <GoogleMapsLoadProxy>
        {api => <GeopointDiff api={api} diff={diff} schemaType={schemaType} />}
      </GoogleMapsLoadProxy>
    </div>
  )
}

function GeopointDiff({api, diff}: DiffProps & {api: typeof window.google.maps}) {
  const fromValue = diff.fromValue || []
  const toValue = diff.toValue || []
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
      {map => (
        <>
          {diff.items
            .filter(item => item.diff.action !== 'unchanged' && item.diff.type === 'object')
            .map(({toIndex, diff: pointDiff}) => (
              // @todo revisit diff type with holm
              <GeopointMove
                key={toIndex}
                api={api}
                map={map}
                diff={pointDiff}
                label={`${toIndex}`}
              />
            ))}
        </>
      )}
    </GoogleMap>
  )
}

function getBounds(
  fromValue: google.maps.LatLngLiteral[] | null | undefined,
  toValue: google.maps.LatLngLiteral[] | null | undefined,
  api: typeof window.google.maps
): google.maps.LatLngBounds {
  const bounds = new api.LatLngBounds()
  const points = [...(fromValue || []), ...(toValue || [])]
  points.forEach(point => bounds.extend(point))
  return bounds
}
