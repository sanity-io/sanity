import {Card, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useVariantsDocumentCounts} from '../../hooks/useVariantsDocumentCounts'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantSetReference, type VariantSetReference} from '../../util/variantSet'
import {planVariantSetDeletion} from '../../util/variantSetDelete'

interface DeleteVariantSetDialogProps {
  setReference: VariantSetReference
  onClose: () => void
  onDone: () => void
}

export function DeleteVariantSetDialog(props: DeleteVariantSetDialogProps): React.JSX.Element {
  const {setReference, onClose, onDone} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {deleteVariant, updateVariant} = useVariantOperations()
  const {data: allVariants, loading} = useAllVariants()
  const {data: documentCounts} = useVariantsDocumentCounts()

  const children = useMemo(
    () => allVariants.filter((variant) => getVariantSetReference(variant)?.id === setReference.id),
    [allVariants, setReference.id],
  )

  const plan = useMemo(
    () =>
      planVariantSetDeletion({
        setReference,
        children,
        documentCountById: documentCounts ?? {},
      }),
    [setReference, children, documentCounts],
  )

  const [isDeleting, setIsDeleting] = useState(false)

  const ready = !loading && children.length > 0
  const hasWork = plan.deleteIds.length > 0 || plan.detaches.length > 0

  const handleConfirm = useCallback(async () => {
    if (!hasWork || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      // Not transactional (no batch action); on partial failure some changes will have landed.
      await Promise.all([
        ...plan.deleteIds.map((id) => deleteVariant(id)),
        ...plan.detaches.map((definition) => updateVariant(definition)),
      ])
      onDone()
    } catch (error) {
      console.error(error)
      toast.push({closable: true, status: 'error', title: t('dialog.delete-set.error.title')})
      setIsDeleting(false)
    }
  }, [deleteVariant, hasWork, isDeleting, onDone, plan, t, toast, updateVariant])

  return (
    <Dialog
      data-testid="delete-variant-set-dialog"
      footer={{
        cancelButton: {
          disabled: isDeleting,
        },
        confirmButton: {
          disabled: isDeleting || !ready || !hasWork,
          loading: isDeleting,
          onClick: handleConfirm,
          text: t('dialog.delete-set.action.confirm'),
          tone: 'critical',
        },
      }}
      header={t('dialog.delete-set.title')}
      id="delete-variant-set-dialog"
      onClose={isDeleting ? undefined : onClose}
    >
      <Stack space={4}>
        <Text muted size={1}>
          {t('dialog.delete-set.description', {name: setReference.name})}
        </Text>

        <Stack space={2}>
          <Text data-testid="delete-set-summary" size={1}>
            {t(
              plan.deleteIds.length === 1
                ? 'dialog.delete-set.summary.delete_one'
                : 'dialog.delete-set.summary.delete_other',
              {count: plan.deleteIds.length},
            )}
          </Text>
        </Stack>

        {plan.retainedCount > 0 && (
          <Card border padding={3} radius={2} tone="caution">
            <Text data-testid="delete-set-retained-warning" size={1}>
              {t(
                plan.retainedCount === 1
                  ? 'dialog.delete-set.warning.retained_one'
                  : 'dialog.delete-set.warning.retained_other',
                {count: plan.retainedCount},
              )}
            </Text>
          </Card>
        )}
      </Stack>
    </Dialog>
  )
}
