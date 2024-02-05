import {useState, useCallback} from 'react'
import {TasksEnabledProvider} from '../enabled'
import {TasksContext} from './TasksContext'

interface TasksProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksProvider(props: TasksProviderProps) {
  const {children} = props
  // TODO: Get this state into the router?
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <TasksEnabledProvider>
      <TasksContext.Provider value={{isOpen, toggleOpen}}>{children}</TasksContext.Provider>
    </TasksEnabledProvider>
  )
}
