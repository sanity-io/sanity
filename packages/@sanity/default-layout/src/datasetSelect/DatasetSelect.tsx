import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Subscription} from 'rxjs'
import {map} from 'rxjs/operators'
import {Select} from '@sanity/ui'
import {state as urlState} from '../datastores/urlState'
import {CONFIGURED_SPACES} from '../util/spaces'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'

export function DatasetSelect(props) {
  const router = useDefaultLayoutRouter()
  const [currentSpace, setCurrentSpace] = useState<{name: string} | null>(null)
  const currentSpaceSubscription: React.MutableRefObject<Subscription | undefined> = useRef()

  const currentSpace$ = urlState.pipe(
    map((event) => event.state && event.state.space),
    map((spaceName) => CONFIGURED_SPACES.find((sp) => sp.name === spaceName))
  )

  useEffect(() => {
    currentSpaceSubscription.current = currentSpace$.subscribe((space) => {
      setCurrentSpace(space)
    })

    return () => {
      currentSpaceSubscription.current.unsubscribe()
    }
  }, [currentSpace$])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      router.navigate({space: event.target.value})
      window.location.reload()
    },
    [router]
  )

  return (
    <Select
      onChange={handleChange}
      value={(currentSpace && currentSpace.name) || undefined}
      radius={2}
      {...props}
    >
      {CONFIGURED_SPACES.map((space) => (
        <option key={space.name} value={space.name}>
          {space.title}
        </option>
      ))}
    </Select>
  )
}
