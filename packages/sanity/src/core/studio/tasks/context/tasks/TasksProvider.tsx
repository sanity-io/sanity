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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  return (
    <TasksEnabledProvider>
      <TasksContext.Provider value={{isSidebarOpen, handleToggleSidebar}}>
        {children}
      </TasksContext.Provider>
    </TasksEnabledProvider>
  )
}
