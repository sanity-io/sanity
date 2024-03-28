import {useMemo, useState} from 'react'

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

  const {data = EMPTY_ARRAY, isLoading} = useTasksStore({})

  const value: TasksContextValue = useMemo(
    () => ({
      activeDocument,
      setActiveDocument,
      isLoading,
      data: data ?? [],
    }),
    [activeDocument, data, isLoading],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
