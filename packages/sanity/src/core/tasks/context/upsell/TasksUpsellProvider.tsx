import {Suspense, use} from 'react'
import {TasksUpsellContext} from 'sanity/_singletons'

import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'
import {useTasksMode} from '../enabled/useTasksMode'

/**
 * Mounted in both plan modes by `TasksStudioLayout`, so the layout never waits for the tasks
 * feature check. The UI that opens the dialog already knows it is in upsell mode (it read or
 * awaited `useTasksMode()`); the dialog leaf below checks once more, at the leaf, so a plan that
 * has tasks never shows it.
 *
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/tasks',
    feature: 'tasks',
  })

  return (
    <TasksUpsellContext.Provider value={contextValue}>
      {props.children}
      <Suspense>
        <TasksUpsellDialog contextValue={contextValue} />
      </Suspense>
    </TasksUpsellContext.Provider>
  )
}

function TasksUpsellDialog({contextValue}: {contextValue: UpsellContextValue}) {
  // Only the upsell mode has a dialog to show; a plan with tasks, or a failed check, never does
  if (use(useTasksMode()) !== 'upsell') return null
  return <UpsellContextDialog contextValue={contextValue} />
}
