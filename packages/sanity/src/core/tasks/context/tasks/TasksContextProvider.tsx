import {useMemo, useState} from 'react'
import {TasksContext} from './TasksContext'
import {TasksContextValue} from './types'

interface TasksContextProviderProps {
  children: React.ReactNode
}

export function TasksContextProvider(props: TasksContextProviderProps) {
  const {children} = props
  const [open, setOpen] = useState<boolean>(false)

  const ctxValue = useMemo(
    (): TasksContextValue => ({
      open,
      setOpen,
    }),
    [open, setOpen],
  )

  return <TasksContext.Provider value={ctxValue}>{children}</TasksContext.Provider>
}
