import {useContext} from 'react'
import {VariantsUpsellContext} from 'sanity/_singletons'

import {type VariantsUpsellContextValue} from './types'

/**
 * @internal
 */
export function useVariantsUpsell(): VariantsUpsellContextValue {
  const value = useContext(VariantsUpsellContext)

  if (!value) return FALLBACK_CONTEXT_VALUE

  return value
}

const FALLBACK_CONTEXT_VALUE = {
  upsellDialogOpen: false,
  handleOpenDialog: () => null,
  handleClose: () => null,
} satisfies VariantsUpsellContextValue
