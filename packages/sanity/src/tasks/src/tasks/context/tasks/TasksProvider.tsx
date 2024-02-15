import {useCallback, useMemo, useState} from 'react'

import {useTasksStore} from '../../store'
import {useTasksSetup} from '../setup/useTasksSetup'
import {TasksContext} from './TasksContext'
import {type TasksContextValue} from './types'
import {useTaskOperations} from './useTaskOperations'

interface TasksProviderProps {
  children: React.ReactNode
}

const EMPTY_ARRAY: [] = []

/**
 * @internal
 */
export function TasksProvider(props: TasksProviderProps) {
  const {children} = props
  // TODO: Get this state into the router?
  const [isOpen, setIsOpen] = useState(false)
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>()
  const {client, runSetup} = useTasksSetup()
  const {data = EMPTY_ARRAY, isLoading} = useTasksStore({
    client,
  })
  const operations = useTaskOperations({client, runSetup})

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value: TasksContextValue = useMemo(
    () => ({
      activeDocumentId,
      setActiveDocumentId,
      isOpen,
      toggleOpen,
      isLoading,
      data: data ?? [],
      operations,
    }),
    [activeDocumentId, data, isLoading, isOpen, operations, toggleOpen],
  )
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
