import {TasksUpsellContext} from 'sanity/_singletons'

import {useUpsellDialog} from '../../../hooks/useUpsellDialog'

/**
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) {
  const {DialogComponent, contextValue} = useUpsellDialog({
    dataUri: '/journey/tasks',
    feature: 'tasks',
  })

  return (
    <TasksUpsellContext.Provider value={contextValue}>
      {props.children}
      <DialogComponent />
    </TasksUpsellContext.Provider>
  )
}
