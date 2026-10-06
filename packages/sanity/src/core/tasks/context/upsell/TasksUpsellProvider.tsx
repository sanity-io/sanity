import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {from} from 'rxjs'
import {TasksUpsellContext} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {useTasksModePromise} from '../enabled/useTasksModePromise'

/**
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) {
  // Mounted in both modes, so read the mode without suspending and only fetch the upsell data
  // once the feature check has answered `upsell`.
  const modePromise = useTasksModePromise()
  const mode$ = useMemo(() => from(modePromise), [modePromise])
  const mode = useObservable(mode$, undefined)

  const contextValue = useUpsellContext({
    dataUri: '/journey/tasks',
    feature: 'tasks',
    enabled: mode === 'upsell',
  })

  return (
    <TasksUpsellContext.Provider value={contextValue}>
      {props.children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </TasksUpsellContext.Provider>
  )
}
