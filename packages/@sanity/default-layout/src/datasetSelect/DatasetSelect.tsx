import React, {useCallback, useEffect, useState} from 'react'
import {filter, map} from 'rxjs/operators'
import {Select} from '@sanity/ui'
import {isSnapshotEvent, state as urlState} from '../datastores/urlState'
import {CONFIGURED_SPACES} from '../util/spaces'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'

export function DatasetSelect(props: Omit<React.HTMLProps<HTMLSelectElement>, 'ref'>) {
  const router = useDefaultLayoutRouter()
  const [currentSpace, setCurrentSpace] = useState<{name: string} | null>(null)

  useEffect(() => {
    const currentSpace$ = urlState.pipe(
      filter(isSnapshotEvent),
      map((event) => event.state && event.state.space),
      map((spaceName) => CONFIGURED_SPACES.find((sp) => sp.name === spaceName))
    )

    const sub = currentSpace$.subscribe(setCurrentSpace)

    return () => {
      sub.unsubscribe()
    }
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      router.navigate({space: event.target.value})
      window.location.reload()
    },
    [router]
  )

  return (
    <Select
      {...props}
      onChange={handleChange}
      value={(currentSpace && currentSpace.name) || undefined}
      radius={2}
    >
      {CONFIGURED_SPACES.map((space) => (
        <option key={space.name} value={space.name}>
          {space.title}
        </option>
      ))}
    </Select>
  )
}
