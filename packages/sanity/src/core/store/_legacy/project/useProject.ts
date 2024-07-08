import {useEffect, useState} from 'react'

import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): {value: ProjectData | null} {
  const projectStore = useProjectStore()
  const [value, setValue] = useState<ProjectData | null>(null)

  useEffect(() => {
    const project$ = projectStore.get()
    const sub = project$.subscribe(setValue)

    // @TODO see if it's better to useObservable here
    return () => sub.unsubscribe()
  }, [projectStore])

  return {value}
}
