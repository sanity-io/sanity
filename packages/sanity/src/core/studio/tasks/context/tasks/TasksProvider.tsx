import {useState, useCallback} from 'react'
import {TasksEnabledProvider} from '../enabled'
import {TasksContext} from './TasksContext'
import {useTasksStore} from '../../store'
import {useTasksSetup} from '../../hooks/useTasksSetup'

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
  const {client} = useTasksSetup()
  const {data = EMPTY_ARRAY, isLoading} = useTasksStore({
    documentId: activeDocumentId,
    client,
  })

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <TasksEnabledProvider>
      <TasksContext.Provider
        value={{
          activeDocumentId,
          setActiveDocumentId,
          isOpen,
          toggleOpen,
          isLoading,
          data: data ?? [],
        }}
      >
        {children}
      </TasksContext.Provider>
    </TasksEnabledProvider>
  )
}
