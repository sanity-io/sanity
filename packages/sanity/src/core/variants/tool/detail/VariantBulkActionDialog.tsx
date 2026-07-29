import {type ReleaseDocument} from '@sanity/client'
import {Box, Card, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useVariantDocumentOperations} from '../../hooks/useVariantDocumentOperations'
import {variantsLocaleNamespace} from '../../i18n'
import {type ReleaseLaneKind} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {
  getVariantBulkActionTargets,
  type VariantBulkAction,
  type VariantBulkActionTarget,
} from './variantBulkActions'
import {getDocumentPreviewTitle} from './variantDocumentTable/getDocumentPreviewTitle'

const KIND_ORDER: Record<ReleaseLaneKind, number> = {published: 0, drafts: 1, release: 2}

const ACTION_TONE: Record<VariantBulkAction, 'positive' | 'caution' | 'critical'> = {
  publish: 'positive',
  unpublish: 'caution',
  delete: 'critical',
}

interface BundleGroup {
  id: string
  kind: ReleaseLaneKind
  label: string
  targets: VariantBulkActionTarget[]
}

/**
 * A single target row: a deselect checkbox, the document's type glyph + title, and its type name —
 * the same [icon] [title] · [type] reading the detail table uses, so the confirm surface is visibly
 * the same family. Kept intentionally light for a dialog (no navigation link / presence / async
 * preview fetch); richer previews + status badges land in Phase 2.
 */
function BulkTargetRow({
  document,
  checked,
  disabled,
  onToggle,
  testId,
}: {
  document: DocumentInVariantGroup['document']
  checked: boolean
  disabled: boolean
  onToggle: () => void
  testId: string
}): React.JSX.Element {
  const schema = useSchema()
  const schemaType = schema.get(document._type)
  const Icon = schemaType?.icon
  const title = getDocumentPreviewTitle(document)

  return (
    <Flex align="center" gap={3}>
      <Checkbox checked={checked} disabled={disabled} id={testId} onChange={onToggle} />
      {Icon && (
        <Text muted size={1}>
          <Icon />
        </Text>
      )}
      <Box flex={1} style={{minWidth: 0}}>
        <Text size={1} textOverflow="ellipsis" title={title}>
          {title}
        </Text>
      </Box>
      <Box flex="none">
        <Text muted size={1}>
          {schemaType?.title || document._type}
        </Text>
      </Box>
    </Flex>
  )
}

/**
 * Confirmation dialog for a bulk action (Publish / Unpublish / Discard) over the documents selected
 * on the variant definition detail table.
 *
 * A selected row is a document *group* that can span several bundles (a draft, the published
 * variant, one or more releases), but each operation targets a single (document × bundle) version.
 * So this dialog resolves the flat selection into the concrete per-bundle targets the chosen action
 * touches, groups them by bundle, and lets the editor deselect individual targets before
 * committing — an honest, itemised preview of exactly what will change (see
 * `docs/initiatives/detail-bulk-actions/multi-bundle-disambiguation-decision.md`, Option B).
 *
 * @internal
 */
export function VariantBulkActionDialog({
  action,
  groups,
  variantId,
  releasesById,
  onClose,
  onSuccess,
}: {
  action: VariantBulkAction
  groups: DocumentInVariantGroup[]
  variantId: string
  releasesById: Map<string, ReleaseDocument>
  onClose: () => void
  onSuccess: () => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {publishVariantDocument, unpublishVariantDocument, deleteVariantDocument} =
    useVariantDocumentOperations()
  const [isProcessing, setIsProcessing] = useState(false)
  // Targets are selected by default; deselecting removes a (document × bundle) target from the run.
  const [deselectedKeys, setDeselectedKeys] = useState<ReadonlySet<string>>(new Set())

  const targets = useMemo(
    () => getVariantBulkActionTargets(groups, variantId, action, releasesById),
    [groups, variantId, action, releasesById],
  )

  // Group targets by bundle, ordered published -> drafts -> releases (by title), each carrying a
  // human label so the dialog reads as "here's what happens, bundle by bundle".
  const bundleGroups = useMemo<BundleGroup[]>(() => {
    const byBundle = new Map<string, BundleGroup>()
    for (const target of targets) {
      const existing = byBundle.get(target.bundle.id)
      if (existing) {
        existing.targets.push(target)
        continue
      }
      const label =
        target.bundle.kind === 'published'
          ? t('detail.documents.bulk.dialog.bundle.published')
          : target.bundle.kind === 'drafts'
            ? t('detail.documents.bulk.dialog.bundle.drafts')
            : (target.bundle.release?.metadata?.title ??
              t('detail.documents.bulk.dialog.bundle.release-unknown'))
      byBundle.set(target.bundle.id, {
        id: target.bundle.id,
        kind: target.bundle.kind,
        label,
        targets: [target],
      })
    }
    return Array.from(byBundle.values()).toSorted((left, right) => {
      const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
      return kindDelta === 0 ? left.label.localeCompare(right.label) : kindDelta
    })
  }, [targets, t])

  const groupsById = useMemo(() => new Map(groups.map((group) => [group.groupId, group])), [groups])

  // Selected documents that produced no target for this action (e.g. publishing a published-only
  // document). Surfaced explicitly so the dialog never silently drops part of the selection.
  const skippedCount = useMemo(() => {
    const withTargets = new Set(targets.map((target) => target.groupId))
    return groups.filter((group) => !withTargets.has(group.groupId)).length
  }, [groups, targets])

  const selectedTargets = useMemo(
    () => targets.filter((target) => !deselectedKeys.has(target.key)),
    [targets, deselectedKeys],
  )
  const selectedCount = selectedTargets.length

  const toggleTarget = useCallback((key: string) => {
    setDeselectedKeys((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const runTarget = useCallback(
    (target: VariantBulkActionTarget) => {
      const params = {
        publishedId: target.publishedId,
        variantId: target.variantId,
        bundleId: target.bundleId,
      }
      if (action === 'publish') return publishVariantDocument(params)
      if (action === 'unpublish') return unpublishVariantDocument(params)
      return deleteVariantDocument(params)
    },
    [action, publishVariantDocument, unpublishVariantDocument, deleteVariantDocument],
  )

  const handleConfirm = useCallback(async () => {
    if (selectedCount === 0) return
    setIsProcessing(true)

    const results = await Promise.allSettled(selectedTargets.map(runTarget))
    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = selectedCount - failed

    if (succeeded > 0) {
      toast.push({
        closable: true,
        status: 'success',
        title: t(`detail.documents.bulk.${action}-toast.success`, {count: succeeded}),
      })
    }
    if (failed > 0) {
      toast.push({
        closable: true,
        status: 'error',
        title: t(`detail.documents.bulk.${action}-toast.error`),
      })
    }

    setIsProcessing(false)
    onSuccess()
    onClose()
  }, [action, onClose, onSuccess, runTarget, selectedCount, selectedTargets, t, toast])

  const hasTargets = targets.length > 0

  return (
    <Dialog
      data-testid={`variant-bulk-${action}-dialog`}
      footer={{
        cancelButton: {disabled: isProcessing},
        confirmButton: {
          text: t(`detail.documents.bulk.${action}-dialog.confirm`),
          tone: ACTION_TONE[action],
          onClick: handleConfirm,
          loading: isProcessing,
          disabled: isProcessing || selectedCount === 0,
        },
      }}
      header={t(`detail.documents.bulk.${action}-dialog.header`)}
      id={`variant-bulk-${action}-dialog`}
      onClose={() => !isProcessing && onClose()}
      width={1}
    >
      <Box padding={4}>
        {hasTargets ? (
          <Stack gap={4}>
            <Stack gap={3}>
              <Text muted size={1}>
                {t(`detail.documents.bulk.${action}-dialog.description`, {count: selectedCount})}
              </Text>
              {skippedCount > 0 && (
                // Selected documents with no target for this action are shown as a count, never
                // silently dropped — the editor knows the selection was larger than the target list.
                <Text muted size={1}>
                  {t('detail.documents.bulk.dialog.skipped', {count: skippedCount})}
                </Text>
              )}
              {action === 'unpublish' &&
                bundleGroups.some((group) => group.kind === 'release') &&
                bundleGroups.some((group) => group.kind === 'published') && (
                  // Unpublish means two different things across bundles; be explicit so the editor
                  // isn't surprised that release targets don't take effect until the release runs.
                  <Text muted size={1}>
                    {t('detail.documents.bulk.unpublish-dialog.mixed-note')}
                  </Text>
                )}
            </Stack>
            {bundleGroups.map((group) => (
              // One section per bundle — the "nested table": a bundle header over its target rows.
              <Stack key={group.id} gap={3}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="semibold">
                    {group.label}
                  </Text>
                  <Text muted size={1}>
                    {group.targets.length}
                  </Text>
                </Flex>
                <Stack paddingLeft={1} gap={3}>
                  {group.targets.map((target) => {
                    const targetGroup = groupsById.get(target.groupId)
                    if (!targetGroup) return null
                    return (
                      <BulkTargetRow
                        key={target.key}
                        checked={!deselectedKeys.has(target.key)}
                        disabled={isProcessing}
                        document={targetGroup.document}
                        onToggle={() => toggleTarget(target.key)}
                        testId={`variant-bulk-target-${target.key}`}
                      />
                    )
                  })}
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Card padding={3} radius={2} tone="transparent">
            <Text muted size={1}>
              {t(`detail.documents.bulk.${action}-dialog.none`)}
            </Text>
          </Card>
        )}
      </Box>
    </Dialog>
  )
}
