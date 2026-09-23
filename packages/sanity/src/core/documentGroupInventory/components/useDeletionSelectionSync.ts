import {type RefObject, useLayoutEffect} from 'react'
import {type ActorRefFromLogic} from 'xstate'

import {type deletionMachine} from '../machines/deletionMachine'

/**
 * Keeps the deletion machine's selection and the allowlist the deletion reads at commit time in
 * step with the rows the configuration allows deleting, and freezes both while the confirmation
 * dialog is open.
 *
 * @internal
 */
export function useDeletionSelectionSync(options: {
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  deletableIds: string[]
  isDeletionActive: boolean
  allowlistRef: RefObject<ReadonlySet<string>>
}): void {
  const {deletionRef, deletableIds, isDeletionActive, allowlistRef} = options

  useLayoutEffect(() => {
    // The deletion machine takes `selection.changed` at the root, so resyncing
    // mid-flow would rewrite the ids the dialog has already listed, counted and
    // reference-checked. The allowlist freezes with them, so what the dialog
    // counts is what the deletion commits.
    if (isDeletionActive) {
      return
    }

    allowlistRef.current = new Set(deletableIds)
    deletionRef.send({type: 'selection.changed', selectedIds: new Set(deletableIds)})
  }, [deletionRef, deletableIds, isDeletionActive, allowlistRef])
}
