import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantTitle} from '../util'
import {type TableVariant} from './VariantsOverviewColumnDefs'

/**
 * Confirmation dialog for bulk-deleting variant definitions from the overview.
 *
 * A definition can only be deleted when it holds no documents (the same guard the single-row delete
 * enforces). Rather than block the whole action when the selection is mixed, this partitions the
 * selection and is explicit about the blast radius: it deletes the empty definitions and clearly
 * reports the doc-bearing ones it is keeping, so the count in the header never hides what actually
 * happens.
 *
 * @internal
 */
export function VariantBulkDeleteDialog({
  variants,
  onClose,
  onDeleted,
}: {
  variants: TableVariant[]
  onClose: () => void
  onDeleted: () => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {deleteVariant} = useVariantOperations()
  const [isProcessing, setIsProcessing] = useState(false)

  // Deletable = definitely empty (count resolved to 0). Definitions with documents, or whose count
  // hasn't resolved yet, are kept so we never delete a definition we can't confirm is empty.
  const {deletable, keptWithDocuments, keptUnresolved} = useMemo(() => {
    const deletableVariants: TableVariant[] = []
    const withDocuments: TableVariant[] = []
    const unresolved: TableVariant[] = []
    for (const variant of variants) {
      if (variant.documentCount === 0) {
        deletableVariants.push(variant)
      } else if (typeof variant.documentCount === 'number' && variant.documentCount > 0) {
        withDocuments.push(variant)
      } else {
        unresolved.push(variant)
      }
    }
    return {
      deletable: deletableVariants,
      keptWithDocuments: withDocuments,
      keptUnresolved: unresolved,
    }
  }, [variants])

  const deletableCount = deletable.length
  const keptWithDocumentsCount = keptWithDocuments.length
  const keptUnresolvedCount = keptUnresolved.length

  const noneMessageKey = useMemo(() => {
    if (keptUnresolvedCount > 0 && keptWithDocumentsCount === 0) {
      return 'overview.bulk.delete-dialog.none-unresolved' as const
    }
    if (keptWithDocumentsCount > 0 && keptUnresolvedCount === 0) {
      return 'overview.bulk.delete-dialog.none' as const
    }
    return 'overview.bulk.delete-dialog.none-mixed' as const
  }, [keptUnresolvedCount, keptWithDocumentsCount])

  const handleConfirm = useCallback(async () => {
    if (deletableCount === 0) return
    setIsProcessing(true)

    const results = await Promise.allSettled(deletable.map((variant) => deleteVariant(variant._id)))
    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = deletableCount - failed

    if (succeeded > 0) {
      toast.push({
        closable: true,
        status: 'success',
        title: t('overview.bulk.delete-toast.success', {count: succeeded}),
      })
    }
    if (failed > 0) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('overview.bulk.delete-toast.error'),
      })
    }

    setIsProcessing(false)
    if (succeeded > 0) {
      onDeleted()
      onClose()
    }
  }, [deletable, deletableCount, deleteVariant, onClose, onDeleted, t, toast])

  return (
    <Dialog
      data-testid="variant-bulk-delete-dialog"
      footer={{
        cancelButton: {disabled: isProcessing},
        confirmButton: {
          text: t('overview.bulk.delete-dialog.confirm'),
          tone: 'critical',
          onClick: handleConfirm,
          loading: isProcessing,
          disabled: isProcessing || deletableCount === 0,
        },
      }}
      header={t('overview.bulk.delete-dialog.header')}
      id="variant-bulk-delete-dialog"
      onClose={() => !isProcessing && onClose()}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          {deletableCount > 0 ? (
            <Text size={1}>
              {t('overview.bulk.delete-dialog.description', {count: deletableCount})}
            </Text>
          ) : (
            <Text size={1}>{t(noneMessageKey)}</Text>
          )}
          {keptWithDocumentsCount > 0 && (
            <Text muted size={1}>
              {t('overview.bulk.delete-dialog.kept', {count: keptWithDocumentsCount})}
            </Text>
          )}
          {keptUnresolvedCount > 0 && (
            <Text muted size={1}>
              {t('overview.bulk.delete-dialog.kept-unresolved', {count: keptUnresolvedCount})}
            </Text>
          )}
          {deletableCount > 0 && (
            <Stack as="ul" space={2}>
              {deletable.map((variant) => (
                <Text as="li" key={variant._id} size={1} textOverflow="ellipsis">
                  {getVariantTitle(variant)}
                </Text>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
