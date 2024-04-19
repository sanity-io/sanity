import {debounce} from 'lodash'
import {useCallback, useMemo, useState} from 'react'

import {useTasksStore} from '../../store'
import {TasksContext} from './TasksContext'
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
  const {data = EMPTY_ARRAY, isLoading, isReady} = useTasksStore({})

  // This change is debounced to wait until the next document loads if we are switching between documents.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetActiveDocument = useCallback(debounce(setActiveDocument, 1000), [])

  const value: TasksContextValue = useMemo(
    () => ({
      activeDocument,
      setActiveDocument: debouncedSetActiveDocument,
      isLoading,
      isReady,
      data: data ?? [],
    }),
    [activeDocument, debouncedSetActiveDocument, isLoading, isReady, data],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
