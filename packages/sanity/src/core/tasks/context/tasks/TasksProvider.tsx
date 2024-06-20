import {debounce} from 'lodash'
import {useMemo, useState} from 'react'
import {TasksContext} from 'sanity/_singletons'

import {useTasksStore} from '../../store'
import {type ActiveDocument, type TasksContextValue} from './types'

interface TasksProviderProps {
  children: React.ReactNode
}

const EMPTY_ARRAY: [] = []

/**
 * @internal
 */
export function TasksProvider(props: TasksProviderProps) {
  const {children} = props
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null)
  const {data = EMPTY_ARRAY, isLoading} = useTasksStore({})

  // This change is debounced to wait until the next document loads if we are switching between documents.
  const debouncedSetActiveDocument = useMemo(() => debounce(setActiveDocument, 1000), [])

  const value: TasksContextValue = useMemo(
    () => ({
      activeDocument,
      setActiveDocument: debouncedSetActiveDocument,
      isLoading,
      data: data ?? [],
    }),
    [activeDocument, data, isLoading, debouncedSetActiveDocument],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
