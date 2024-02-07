import {useState, useCallback} from 'react'
import {TasksContext} from './TasksContext'
import {useRouter} from '../../../../router'

interface TasksProviderProps {
  children: React.ReactNode
  enabled: boolean
}

/**
 * @internal
 */
export function TasksProvider(props: TasksProviderProps) {
  const {children, enabled} = props
  // TODO: Get this state into the router?
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  return (
    <TasksContext.Provider value={{isSidebarOpen, handleToggleSidebar, enabled}}>
      {children}
    </TasksContext.Provider>
  )
}
