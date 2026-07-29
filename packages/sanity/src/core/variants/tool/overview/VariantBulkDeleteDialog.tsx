import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useClient} from '../../../hooks/useClient'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {buildVariantsDocumentCountsQuery} from '../../hooks/useVariantsDocumentCounts'
import {variantsLocaleNamespace} from '../../i18n'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../store/constants'
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
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const [isProcessing, setIsProcessing] = useState(false)
  // Synchronous re-entry guard (the confirm button only disables on the next render).
  const isProcessingRef = useRef(false)

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
    if (deletableCount === 0 || isProcessingRef.current) return
    isProcessingRef.current = true
    setIsProcessing(true)

    try {
      // Interim safety re-check (SAPT-48): `documentCount` driving `deletable` comes from a lagging
      // listener, so re-fetch authoritative counts right before deleting and drop any definition
      // that now holds documents. Best-effort only — NOT the real guard: there is still a race
      // between this fetch and the delete, and no RBAC. The delete action must enforce emptiness +
      // permission server-side (SAPT-48). If the re-check itself fails, we abort rather than delete.
      const freshCounts = await client.fetch<Record<string, number>>(
        buildVariantsDocumentCountsQuery(deletable.map((variant) => variant._id)).fetch,
        {},
        {perspective: 'raw', tag: 'variants-bulk-delete.recount'},
      )
      const confirmedEmpty = deletable.filter((variant) => (freshCounts[variant._id] ?? 0) === 0)
      const droppedNonEmpty = deletable.length - confirmedEmpty.length

      if (droppedNonEmpty > 0) {
        toast.push({
          closable: true,
          status: 'warning',
          title: t('overview.bulk.delete-toast.recount-dropped', {count: droppedNonEmpty}),
        })
      }

      if (confirmedEmpty.length === 0) {
        onClose()
        return
      }

      const results = await Promise.allSettled(
        confirmedEmpty.map((variant) => deleteVariant(variant._id)),
      )
      const failed = results.filter((result) => result.status === 'rejected').length
      const succeeded = confirmedEmpty.length - failed

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

      // Only clear the selection / close on at least one success, so a total failure keeps the
      // selection for retry.
      if (succeeded > 0) {
        onDeleted()
        onClose()
      }
    } catch (err) {
      // A synchronous throw from deleteVariant (e.g. a precondition error) must still release the
      // dialog — otherwise isProcessing stays true and the dialog hangs with no exit.
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: t('overview.bulk.delete-toast.error'),
      })
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }, [client, deletable, deletableCount, deleteVariant, onClose, onDeleted, t, toast])

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
