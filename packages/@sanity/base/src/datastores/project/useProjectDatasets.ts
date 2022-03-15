import {useEffect, useState} from 'react'
import {useDatastores} from '../useDatastores'
import {ProjectDatasetData} from './types'

export function useProjectDatasets(): {value: ProjectDatasetData[] | null} {
  const datastores = useDatastores()
  const [value, setValue] = useState<ProjectDatasetData[] | null>(null)

  useEffect(() => {
    const project$ = datastores.projectStore.getDatasets()
    const sub = project$.subscribe(setValue)

    return () => sub.unsubscribe()
  }, [datastores])

  return {value}
}
