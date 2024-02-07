import {useContext} from 'react'
import {TasksSetupContext, TasksSetupContextValue} from '../context'

export function useTasksSetup(): TasksSetupContextValue {
  const ctx = useContext(TasksSetupContext)

  if (!ctx) {
    throw new Error('useTasksSetup: missing context value')
  }

  return ctx
}
