import {TasksUpsellContext} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

/**
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) : React.JSX.Element {
  const contextValue = useUpsellContext({
    dataUri: '/journey/tasks',
    feature: 'tasks',
  })

  return (
    <TasksUpsellContext.Provider value={contextValue}>
      {props.children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </TasksUpsellContext.Provider>
  )
}
