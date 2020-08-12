import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {ObjectDiff} from '@sanity/diff'
import {useUser} from '@sanity/react-hooks'
import {UserAvatar} from '@sanity/components/presence'
import {Marker} from '../map/Marker'
import {Arrow} from '../map/Arrow'
import {Geopoint, Annotation} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  diff: ObjectDiff<Annotation, Geopoint>
  label?: string
}

export function GeopointMove({diff, api, map, label}: Props) {
  const {fromValue: from, toValue: to} = diff
  const annotation = diff.isChanged ? diff.annotation : undefined
  const fromRef = React.useRef<google.maps.Marker>()
  const toRef = React.useRef<google.maps.Marker>()
  const infoEl = React.useRef(document.createElement('div'))
  const infoWindow = React.useRef(new api.InfoWindow({content: infoEl.current}))
  const openInfoOn = (ref: React.MutableRefObject<google.maps.Marker | undefined>) =>
    React.useCallback(() => {
      const current = ref.current
      if (!current) {
        return
      }

      infoWindow.current.open(map, current)

      const position = current.getPosition()
      if (position) {
        map.panTo(position)
      }
    }, [infoWindow.current, map])

  const openInfoOnFrom = openInfoOn(fromRef)
  const openInfoOnTo = openInfoOn(toRef)

  return (
    <>
      {from && (
        <Marker
          api={api}
          map={map}
          position={from}
          zIndex={0}
          opacity={0.75}
          onClick={openInfoOnFrom}
          markerRef={fromRef}
          label={label}
        />
      )}
      {from && to && <Arrow api={api} map={map} from={from} to={to} zIndex={1} />}
      {to && (
        <Marker
          api={api}
          map={map}
          position={to}
          zIndex={2}
          onClick={openInfoOnTo}
          markerRef={toRef}
          label={label}
        />
      )}
      {annotation &&
        ReactDOM.createPortal(<AnnotationInfo annotation={annotation} />, infoEl.current)}
    </>
  )
}

function UserItem(props: {userId: string}) {
  const {isLoading, error, value: user} = useUser(props.userId)

  // @todo handle?
  if (error) {
    return null
  }

  if (isLoading) {
    return <em>Loading…</em>
  }

  return user ? (
    <>
      <UserAvatar user={user} /> {user.displayName}
    </>
  ) : null
}

function AnnotationInfo({annotation}: {annotation: Annotation}) {
  return <UserItem userId={annotation.author} />
}
