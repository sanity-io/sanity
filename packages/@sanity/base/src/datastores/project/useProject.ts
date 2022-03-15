import {useEffect, useState} from 'react'
import {useDatastores} from '../useDatastores'
import {ProjectData} from './types'

export function useProject(): {value: ProjectData | null} {
  const datastores = useDatastores()
  const [value, setValue] = useState<ProjectData | null>(null)

  useEffect(() => {
    const project$ = datastores.projectStore.get()
    const sub = project$.subscribe(setValue)

    return () => sub.unsubscribe()
  }, [datastores])

  return {value}
}
