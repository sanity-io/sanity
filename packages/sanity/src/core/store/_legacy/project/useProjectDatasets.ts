import {useEffect, useState} from 'react'
import {useProjectStore} from '../datastores'
import {ProjectDatasetData} from './types'

/** @internal */
export function useProjectDatasets(): {value: ProjectDatasetData[] | null} {
  const projectStore = useProjectStore()
  const [value, setValue] = useState<ProjectDatasetData[] | null>(null)

  useEffect(() => {
    const project$ = projectStore.getDatasets()
    const sub = project$.subscribe(setValue)

    return () => sub.unsubscribe()
  }, [projectStore])

  return {value}
}
