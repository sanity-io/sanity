import {type ReactNode, Suspense, use, useCallback, useMemo, useState} from 'react'
import {VariantsUpsellContext} from 'sanity/_singletons'

import {VariantsUpsellDialog} from '../../components/upsell/VariantsUpsellDialog'
import {useVariantsMode} from '../mode/useVariantsMode'
import {type VariantsUpsellContextValue} from './types'

/**
 * Mounted in every plan mode by `VariantsStudioProvider`, so the studio never waits for the
 * content variants feature check. The UI that opens the dialog already knows it is in upsell
 * mode; the dialog leaf below checks once more, so a plan that has variants never shows it.
 *
 * @internal
 */
export function VariantsUpsellProvider(props: {children: ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)

  const handleOpenDialog = useCallback(() => setUpsellDialogOpen(true), [])
  const handleClose = useCallback(() => setUpsellDialogOpen(false), [])

  const contextValue = useMemo<VariantsUpsellContextValue>(
    () => ({upsellDialogOpen, handleOpenDialog, handleClose}),
    [upsellDialogOpen, handleOpenDialog, handleClose],
  )

  return (
    <VariantsUpsellContext value={contextValue}>
      {props.children}
      {upsellDialogOpen && (
        <Suspense>
          <VariantsUpsellModeDialog onClose={handleClose} />
        </Suspense>
      )}
    </VariantsUpsellContext>
  )
}

function VariantsUpsellModeDialog({onClose}: {onClose: () => void}) {
  if (use(useVariantsMode()) !== 'upsell') return null
  return <VariantsUpsellDialog onClose={onClose} />
}
