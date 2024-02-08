import {useState, useCallback} from 'react'
import {TasksEnabledProvider} from '../enabled'
import {TasksContext} from './TasksContext'
import {useTasksStore} from '../../store'
import {useClient} from '../../../../hooks'
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
  const {client} = useTasksSetup()
  const publishedId = undefined
  const {data = EMPTY_ARRAY, isLoading} = useTasksStore({
    documentId: publishedId,
    client,
  })

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <TasksEnabledProvider>
      <TasksContext.Provider value={{isOpen, toggleOpen, isLoading, data}}>
        {children}
      </TasksContext.Provider>
    </TasksEnabledProvider>
  )
}
