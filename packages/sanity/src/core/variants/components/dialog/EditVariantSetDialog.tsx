import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useVariantsDocumentCounts} from '../../hooks/useVariantsDocumentCounts'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantSetReference, type VariantSetReference} from '../../util/variantSet'
import {
  type DimensionEdit,
  planVariantSetEdit,
  reconstructVariantSetDimensions,
} from '../../util/variantSetEdit'
import {EditVariantSetForm} from './EditVariantSetForm'

interface EditVariantSetDialogProps {
  setReference: VariantSetReference
  onCancel: () => void
  onDone: () => void
}

export function EditVariantSetDialog(props: EditVariantSetDialogProps): React.JSX.Element {
  const {setReference, onCancel, onDone} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {createVariant, updateVariant, deleteVariant} = useVariantOperations()
  const {data: allVariants, loading} = useAllVariants()
  const {data: documentCounts} = useVariantsDocumentCounts()

  const children = useMemo(
    () => allVariants.filter((variant) => getVariantSetReference(variant)?.id === setReference.id),
    [allVariants, setReference.id],
  )
  const initialDimensions = useMemo(() => reconstructVariantSetDimensions(children), [children])

  const [edits, setEdits] = useState<DimensionEdit[]>([])
  const [isApplying, setIsApplying] = useState(false)

  const plan = useMemo(
    () =>
      planVariantSetEdit({
        setReference,
        children,
        documentCountById: documentCounts ?? {},
        edits,
      }),
    [setReference, children, documentCounts, edits],
  )

  const changeCount = plan.updates.length + plan.creates.length + plan.deletes.length
  const hasChanges = changeCount > 0
  const ready = !loading && children.length > 0

  const handleApply = useCallback(async () => {
    if (!hasChanges || isApplying) {
      return
    }

    setIsApplying(true)

    try {
      // Not transactional (no batch action); on partial failure some changes will have landed.
      await Promise.all([
        ...plan.updates.map((definition) => updateVariant(definition)),
        ...plan.creates.map((definition) => createVariant(definition)),
        ...plan.deletes.map((deletion) => deleteVariant(deletion.id)),
      ])
      onDone()
    } catch (error) {
      console.error(error)
      toast.push({closable: true, status: 'error', title: t('dialog.edit-set.error.title')})
      setIsApplying(false)
    }
  }, [createVariant, deleteVariant, hasChanges, isApplying, onDone, plan, t, toast, updateVariant])

  const previewLines = useMemo(() => {
    const lines: string[] = []
    if (plan.updates.length > 0) {
      lines.push(
        t(
          plan.updates.length === 1
            ? 'dialog.edit-set.preview.update_one'
            : 'dialog.edit-set.preview.update_other',
          {count: plan.updates.length},
        ),
      )
    }
    if (plan.creates.length > 0) {
      lines.push(
        t(
          plan.creates.length === 1
            ? 'dialog.edit-set.preview.create_one'
            : 'dialog.edit-set.preview.create_other',
          {count: plan.creates.length},
        ),
      )
    }
    if (plan.deletes.length > 0) {
      lines.push(
        t(
          plan.deletes.length === 1
            ? 'dialog.edit-set.preview.delete_one'
            : 'dialog.edit-set.preview.delete_other',
          {count: plan.deletes.length},
        ),
      )
    }
    return lines
  }, [plan.creates.length, plan.deletes.length, plan.updates.length, t])

  const blockedValues = plan.blockedRemovals.map((removal) => removal.value).join(', ')
  const conflictValues = plan.renameConflicts.map((conflict) => conflict.to).join(', ')

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={t('dialog.edit-set.title')}
      id="edit-variant-set-dialog"
      onClickOutside={isApplying ? undefined : onCancel}
      onClose={isApplying ? undefined : onCancel}
      padding={false}
      width={1}
    >
      <Card borderTop padding={4}>
        <Stack space={4}>
          <Text muted size={1}>
            {t('dialog.edit-set.description')}
          </Text>

          {ready ? (
            <EditVariantSetForm
              key={setReference.id}
              initialDimensions={initialDimensions}
              onChange={setEdits}
            />
          ) : (
            <Box paddingY={4}>
              <Text muted size={1}>
                {t('detail.loading')}
              </Text>
            </Box>
          )}

          <Stack space={3}>
            <Card border padding={3} radius={2} tone={hasChanges ? 'primary' : 'transparent'}>
              <Stack space={2}>
                {previewLines.length > 0 ? (
                  previewLines.map((line) => (
                    <Text key={line} data-testid="edit-set-preview-line" size={1}>
                      {line}
                    </Text>
                  ))
                ) : (
                  <Text data-testid="edit-set-preview-line" muted size={1}>
                    {t('dialog.edit-set.preview.none')}
                  </Text>
                )}
              </Stack>
            </Card>

            {blockedValues && (
              <Card border padding={3} radius={2} tone="caution">
                <Text data-testid="edit-set-blocked-warning" size={1}>
                  {t('dialog.edit-set.warning.blocked', {values: blockedValues})}
                </Text>
              </Card>
            )}
            {conflictValues && (
              <Card border padding={3} radius={2} tone="caution">
                <Text data-testid="edit-set-conflict-warning" size={1}>
                  {t('dialog.edit-set.warning.conflict', {values: conflictValues})}
                </Text>
              </Card>
            )}
          </Stack>

          <Flex gap={2} justify="flex-end">
            <Button
              disabled={isApplying}
              mode="ghost"
              onClick={onCancel}
              text={t('dialog.edit-set.action.cancel')}
              type="button"
            />
            <Button
              data-testid="edit-set-apply-button"
              disabled={!hasChanges || isApplying}
              loading={isApplying}
              onClick={handleApply}
              size="large"
              text={t('dialog.edit-set.action.apply')}
              type="button"
            />
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  )
}
