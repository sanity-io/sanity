import {useActorRef} from '@xstate/react'
import {useMemo} from 'react'

import {type DocumentGroupInventoryHandle} from '../../src/core/documentGroupInventory/components/DocumentGroupInventory'
import {deletionMachine} from '../../src/core/documentGroupInventory/machines/deletionMachine'
import {documentGroupInventoryMachine} from '../../src/core/documentGroupInventory/machines/documentGroupInventoryMachine'
import {selectionMachine} from '../../src/core/documentGroupInventory/machines/selectionMachine'
import {variantCreationMachine} from '../../src/core/documentGroupInventory/machines/variantCreationMachine'
import {useTranslation} from '../../src/core/i18n/hooks/useTranslation'

/**
 * Runs the real document group inventory machine, with its default (inert) actors, and returns the
 * handle `DocumentGroupInventory` exposes through its `ref`. Lets tests outside `src/core` stand in
 * for the inventory while still driving the machine callers interact with.
 */
export function useTestDocumentGroupInventoryHandle({
  variantsEnabled = true,
  readOnly = false,
}: {variantsEnabled?: boolean; readOnly?: boolean} = {}): DocumentGroupInventoryHandle {
  const {t} = useTranslation()
  const inventory = useActorRef(documentGroupInventoryMachine, {
    input: {
      t,
      variantsEnabled,
      readOnly,
      selectionMachine,
      deletionMachine,
      variantCreationMachine,
    },
  })

  return useMemo(() => ({inventory}), [inventory])
}
