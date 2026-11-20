import {useToast} from '@sanity/ui/toast'
import {use, useCallback, useState} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useVariantsMode} from '../contexts/mode/useVariantsMode'
import {useVariantsUpsell} from '../contexts/upsell/useVariantsUpsell'
import {getVariantId} from '../tool/util'

/**
 * Shared duplicate action state for variant menu buttons.
 *
 * Duplicating creates a definition, so it is gated like "New variant definition": without the
 * content variants feature it opens the upsell dialog, and when the feature check failed it fails
 * closed with an error toast. Once the duplicate exists, the tool navigates to it.
 *
 * Reads the variants mode with `use()`, so it suspends up to the tool's loading block until the
 * feature check has answered.
 *
 * @internal
 */
export function useVariantDuplicateAction(): {
  handleCloseDuplicateDialog: () => void
  handleDuplicate: () => void
  handleDuplicated: (duplicatedVariantId: string) => void
  isDuplicateDialogOpen: boolean
} {
  const mode = use(useVariantsMode())
  const {handleOpenDialog: handleOpenUpsellDialog} = useVariantsUpsell()
  const {t: tStudio} = useTranslation()
  const toast = useToast()
  const router = useRouter()
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)

  const handleDuplicate = useCallback(() => {
    if (mode === null) {
      toast.push({
        status: 'error',
        title: tStudio('errors.unable-to-perform-action'),
        closable: true,
      })
      return
    }

    if (mode === 'upsell') {
      handleOpenUpsellDialog('navbar')
      return
    }

    setIsDuplicateDialogOpen(true)
  }, [handleOpenUpsellDialog, mode, tStudio, toast])

  const handleCloseDuplicateDialog = useCallback(() => setIsDuplicateDialogOpen(false), [])

  const handleDuplicated = useCallback(
    (duplicatedVariantId: string) => {
      setIsDuplicateDialogOpen(false)
      router.navigate({variantId: getVariantId(duplicatedVariantId)})
    },
    [router],
  )

  return {
    handleCloseDuplicateDialog,
    handleDuplicate,
    handleDuplicated,
    isDuplicateDialogOpen,
  }
}
