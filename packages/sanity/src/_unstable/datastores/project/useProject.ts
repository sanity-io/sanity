import {useEffect, useState} from 'react'
import {useProjectStore} from '../datastores'
import {ProjectData} from './types'

export function useProject(): {value: ProjectData | null} {
  const projectStore = useProjectStore()
  const [value, setValue] = useState<ProjectData | null>(null)

  useEffect(() => {
    const project$ = projectStore.get()
    const sub = project$.subscribe(setValue)

    return () => sub.unsubscribe()
  }, [projectStore])

  return {value}
}
