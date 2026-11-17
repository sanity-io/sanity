/**
 * REVIEW BUILD ONLY. Never part of a pull request.
 *
 * The one seam that lets the version inventory run main's, the baseline's or option C's delete
 * dialog and deletion machine, chosen by `?delete=main|baseline|c` (see `deleteMode.ts`).
 * `DocumentGroupInventory` keys itself on the mode, picks the machine with
 * `deletionMachineForMode` and renders `DeleteModeDialog` in place of the dialog.
 */
import {type SanityClient} from '@sanity/client'
import {Card} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentProps, useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {type Observable} from 'rxjs'
import {Flex, Text} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {ConfirmDeleteDialog as BaselineConfirmDeleteDialog} from '../components/ConfirmDeleteDialog'
import {
  type deletionMachine as baselineDeletionMachine,
  type ReferringDocuments,
} from '../machines/deletionMachine'
import {type selectionMachine} from '../machines/selectionMachine'
import {ConfirmDeleteDialog as CConfirmDeleteDialog} from './c/ConfirmDeleteDialog'
import {deletionMachine as cDeletionMachine} from './c/deletionMachine'
import {withReferenceStrength} from './c/withReferenceStrength'
import {
  DELETE_MODE_LABELS,
  DELETE_MODES,
  type DeleteMode,
  setDeleteMode,
  setPendingReopen,
  takePendingReopen,
} from './deleteMode'
import {ConfirmDeleteDialog as MainConfirmDeleteDialog} from './main/ConfirmDeleteDialog'
import {deletionMachine as mainDeletionMachine} from './main/deletionMachine'

export {useDeleteMode, type DeleteMode} from './deleteMode'

type BaselineDeletionMachine = typeof baselineDeletionMachine

/**
 * The deletion machine for `mode`. The inventory machine is typed with the baseline's; main's and
 * option C's take the same events the inventory sends (main's ignores `versions.changed`), so they
 * are passed under that type.
 */
export function deletionMachineForMode(
  mode: DeleteMode,
  baseline: BaselineDeletionMachine,
): BaselineDeletionMachine {
  // oxlint-disable-next-line no-unsafe-type-assertion -- review build only: the modes share the inventory's events
  if (mode === 'main') return mainDeletionMachine as unknown as BaselineDeletionMachine
  // oxlint-disable-next-line no-unsafe-type-assertion -- review build only: the modes share the inventory's events
  if (mode === 'c') return cDeletionMachine as unknown as BaselineDeletionMachine
  return baseline
}

/** Option C reads each link's strength before Delete; main and the baseline don't. */
export function referringDocumentsForMode(
  mode: DeleteMode,
  referringDocuments$: Observable<ReferringDocuments>,
  documentId: string,
  client: SanityClient,
): Observable<ReferringDocuments> {
  return mode === 'c'
    ? withReferenceStrength(referringDocuments$, documentId, client)
    : referringDocuments$
}

type DialogProps = ComponentProps<typeof BaselineConfirmDeleteDialog>

export function DeleteModeDialog(props: DialogProps & {mode: DeleteMode}) {
  const {mode, ...dialogProps} = props
  let dialog
  if (mode === 'main') {
    dialog = (
      <MainConfirmDeleteDialog
        {...dialogProps}
        deletionRef={
          // oxlint-disable-next-line no-unsafe-type-assertion -- review build only: this ref runs main's machine
          dialogProps.deletionRef as unknown as ActorRefFromLogic<typeof mainDeletionMachine>
        }
      />
    )
  } else if (mode === 'c') {
    dialog = (
      <CConfirmDeleteDialog
        {...dialogProps}
        deletionRef={
          // oxlint-disable-next-line no-unsafe-type-assertion -- review build only: this ref runs option C's machine
          dialogProps.deletionRef as unknown as ActorRefFromLogic<typeof cDeletionMachine>
        }
      />
    )
  } else {
    dialog = <BaselineConfirmDeleteDialog {...dialogProps} />
  }
  return (
    <>
      {dialog}
      <DeleteModeChip
        mode={mode}
        documentId={dialogProps.documentId}
        selectionRef={dialogProps.selectionRef}
      />
    </>
  )
}

/**
 * A floating switch, above the dialog. Switching remounts the inventory with the other mode's
 * machine and re-opens the dialog on the same selection.
 */
function DeleteModeChip({
  mode,
  documentId,
  selectionRef,
}: {
  mode: DeleteMode
  documentId: string
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
}) {
  const selectedIds = useSelector(selectionRef, ({context}) => context.selectedIds)
  if (typeof document === 'undefined') return null
  return createPortal(
    <Card
      data-testid="delete-mode-chip"
      radius={3}
      shadow={3}
      padding={2}
      tone="primary"
      style={{position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 2e6}}
    >
      <Flex alignItems="center" gap={2}>
        <Text size={1} weight="medium" as="div" trim={true}>
          Delete mode (review build only): {DELETE_MODE_LABELS[mode]}
        </Text>
        {DELETE_MODES.map((option) => (
          <Button
            key={option}
            mode={option === mode ? 'default' : 'ghost'}
            selected={option === mode}
            text={DELETE_MODE_LABELS[option]}
            onClick={() => {
              if (option === mode) return
              setPendingReopen(documentId, [...selectedIds])
              setDeleteMode(option)
            }}
          />
        ))}
      </Flex>
    </Card>,
    document.body,
  )
}

/** After a mode switch, selects the same versions again and re-opens the delete dialog. */
export function useReopenAfterModeSwitch({
  documentId,
  selectionRef,
  deletionRef,
}: {
  documentId: string
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  deletionRef: ActorRefFromLogic<BaselineDeletionMachine>
}): void {
  const pending = useRef<string[] | undefined>(undefined)
  const variantIds = useSelector(selectionRef, ({context}) =>
    context.variants.map(({id}) => id).join(','),
  )
  const isLoading = useSelector(selectionRef, (snapshot) => snapshot.matches('loading'))

  useEffect(() => {
    pending.current = takePendingReopen(documentId)
  }, [documentId])

  useEffect(() => {
    const selectedIds = pending.current
    if (!selectedIds || isLoading) return
    const available = new Set(variantIds.split(','))
    const ids = selectedIds.filter((id) => available.has(id))
    if (ids.length === 0) return
    pending.current = undefined
    selectionRef.send({type: 'selection.addMany', variantIds: ids})
    deletionRef.send({type: 'delete.request'})
  }, [isLoading, variantIds, selectionRef, deletionRef])
}
