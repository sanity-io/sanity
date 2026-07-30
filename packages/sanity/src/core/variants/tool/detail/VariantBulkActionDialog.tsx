import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RelativeTime} from '../../../components/RelativeTime'
import {useAsyncAction} from '../../../hooks/useAsyncAction'
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

/** The per-bundle consequence copy for a given action + bundle kind (null when not applicable). */
function getEffectKey(action: VariantBulkAction, kind: ReleaseLaneKind): string | null {
  const map: Record<string, string> = {
    'publish:drafts': 'detail.documents.bulk.dialog.effect.publish-drafts',
    'unpublish:published': 'detail.documents.bulk.dialog.effect.unpublish-published',
    'unpublish:release': 'detail.documents.bulk.dialog.effect.unpublish-release',
    'delete:drafts': 'detail.documents.bulk.dialog.effect.delete-drafts',
    'delete:release': 'detail.documents.bulk.dialog.effect.delete-release',
  }
  return map[`${action}:${kind}`] ?? null
}

type TargetStatus = 'success' | 'error'

interface BundleGroup {
  id: string
  kind: ReleaseLaneKind
  label: string
  /** Scheduled run time of a release bundle, shown in the header. */
  scheduledAt?: string
  targets: VariantBulkActionTarget[]
}

/**
 * A single target row: a deselect checkbox (or a result icon after commit), the document's type
 * glyph + title, an optional validation warning, and its type name — the same [icon] [title] · [type]
 * reading the detail table uses, so the confirm surface is visibly the same family. Kept light for a
 * dialog (no navigation link / presence / async preview fetch).
 */
function BulkTargetRow({
  document,
  checked,
  disabled,
  hasValidationError,
  status,
  onToggle,
  testId,
  validationLabel,
}: {
  document: DocumentInVariantGroup['document']
  checked: boolean
  disabled: boolean
  hasValidationError: boolean
  status?: TargetStatus
  onToggle: () => void
  testId: string
  validationLabel: string
}): React.JSX.Element {
  const schema = useSchema()
  const schemaType = schema.get(document._type)
  const Icon = schemaType?.icon
  const title = getDocumentPreviewTitle(document)

  return (
    <Flex align="center" gap={3}>
      <Box flex="none" style={{width: 17, display: 'flex', justifyContent: 'center'}}>
        {status ? (
          <Text size={1}>
            <ToneIcon
              icon={status === 'success' ? CheckmarkCircleIcon : ErrorOutlineIcon}
              tone={status === 'success' ? 'positive' : 'critical'}
            />
          </Text>
        ) : (
          <Checkbox checked={checked} disabled={disabled} id={testId} onChange={onToggle} />
        )}
      </Box>
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
      {hasValidationError && (
        <Tooltip content={validationLabel} portal>
          <Text size={1}>
            <ToneIcon icon={WarningOutlineIcon} tone="caution" />
          </Text>
        </Tooltip>
      )}
      <Box flex="none">
        <Text muted size={1}>
          {schemaType?.title || document._type}
        </Text>
      </Box>
    </Flex>
  )
}

/**
 * Confirmation dialog for a bulk action (Publish / Unpublish / Delete) over the documents selected
 * on the variant definition detail table.
 *
 * A selected row is a document *group* that can span several bundles (a draft, the published
 * variant, one or more releases), but each operation targets a single (document × bundle) version.
 * So this dialog resolves the flat selection into the concrete per-bundle targets the chosen action
 * touches, renders them as a grouped ("nested") table — group = bundle, row = target — with each
 * group's consequence spelled out, and lets the editor deselect individual targets before
 * committing. An honest, itemised preview of exactly what will change (see
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
  // Targets are selected by default; deselecting removes a (document × bundle) target from the run.
  const [deselectedKeys, setDeselectedKeys] = useState<ReadonlySet<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())
  // Set after commit: a per-target success/error map. Present ⇒ the run happened; if any failed the
  // dialog stays open showing which, rather than closing on a summary toast alone.
  const [results, setResults] = useState<ReadonlyMap<string, TargetStatus> | null>(null)

  const targets = useMemo(
    () => getVariantBulkActionTargets(groups, variantId, action, releasesById),
    [groups, variantId, action, releasesById],
  )

  const groupsById = useMemo(() => new Map(groups.map((group) => [group.groupId, group])), [groups])

  // Group targets by bundle, ordered published -> drafts -> releases (by title), each carrying a
  // human label + (for scheduled releases) a run time, so the dialog reads bundle by bundle.
  const bundleGroups = useMemo<BundleGroup[]>(() => {
    const byBundle = new Map<string, BundleGroup>()
    for (const target of targets) {
      const existing = byBundle.get(target.bundle.id)
      if (existing) {
        existing.targets.push(target)
        continue
      }
      const release = target.bundle.release
      const label =
        target.bundle.kind === 'published'
          ? t('detail.documents.bulk.dialog.bundle.published')
          : target.bundle.kind === 'drafts'
            ? t('detail.documents.bulk.dialog.bundle.drafts')
            : (release?.metadata?.title ?? t('detail.documents.bulk.dialog.bundle.release-unknown'))
      byBundle.set(target.bundle.id, {
        id: target.bundle.id,
        kind: target.bundle.kind,
        label,
        scheduledAt:
          release?.metadata?.releaseType === 'scheduled'
            ? release.metadata.intendedPublishAt
            : undefined,
        targets: [target],
      })
    }
    return Array.from(byBundle.values()).toSorted((left, right) => {
      const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
      return kindDelta === 0 ? left.label.localeCompare(right.label) : kindDelta
    })
  }, [targets, t])

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

  const toggleGroup = useCallback((group: BundleGroup) => {
    setDeselectedKeys((previous) => {
      const next = new Set(previous)
      const allSelected = group.targets.every((target) => !next.has(target.key))
      for (const target of group.targets) {
        if (allSelected) next.add(target.key)
        else next.delete(target.key)
      }
      return next
    })
  }, [])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  // useAsyncAction owns the re-entry guard + isProcessing lifecycle: the confirm button's `disabled`
  // only applies after a re-render, so a fast double-click could otherwise start the action loop
  // twice within the same tick. Promise.allSettled never rejects, so per-target failures are reported
  // inline (toast + results map); onError only catches an unexpected throw before the settle,
  // releasing the dialog rather than leaving isProcessing stuck true.
  const {run: handleConfirm, isRunning: isProcessing} = useAsyncAction(
    async () => {
      if (selectedCount === 0) return

      const settled = await Promise.allSettled(selectedTargets.map(runTarget))
      const byKey = new Map<string, TargetStatus>()
      settled.forEach((result, index) => {
        byKey.set(selectedTargets[index]!.key, result.status === 'fulfilled' ? 'success' : 'error')
      })
      const failed = settled.filter((result) => result.status === 'rejected').length
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

      // Clean run: clear the selection and close. Partial/total failure: keep the dialog open with a
      // per-row breakdown so the editor can see exactly which targets failed.
      if (failed === 0) {
        onSuccess()
        onClose()
        return
      }
      setResults(byKey)
    },
    {
      onError: (err) => {
        console.error(err)
        toast.push({
          closable: true,
          status: 'error',
          title: t(`detail.documents.bulk.${action}-toast.error`),
        })
      },
    },
  )

  const handleResultsClose = useCallback(() => {
    // Some targets may have succeeded before the failures — clear the selection on the way out.
    onSuccess()
    onClose()
  }, [onClose, onSuccess])

  const hasTargets = targets.length > 0
  const showMixedUnpublishNote =
    action === 'unpublish' &&
    bundleGroups.some((group) => group.kind === 'release') &&
    bundleGroups.some((group) => group.kind === 'published')
  const failedCount = results
    ? Array.from(results.values()).filter((status) => status === 'error').length
    : 0

  return (
    <Dialog
      data-testid={`variant-bulk-${action}-dialog`}
      footer={
        results
          ? {
              confirmButton: {
                text: t('detail.documents.bulk.dialog.close'),
                tone: 'default',
                onClick: handleResultsClose,
              },
            }
          : {
              cancelButton: {disabled: isProcessing},
              confirmButton: {
                text: t(`detail.documents.bulk.${action}-dialog.confirm`),
                tone: ACTION_TONE[action],
                onClick: handleConfirm,
                loading: isProcessing,
                disabled: isProcessing || selectedCount === 0,
              },
            }
      }
      header={t(`detail.documents.bulk.${action}-dialog.header`)}
      id={`variant-bulk-${action}-dialog`}
      onClose={() => !isProcessing && (results ? handleResultsClose() : onClose())}
      width={1}
    >
      <Box padding={4}>
        {hasTargets ? (
          <Stack gap={4}>
            <Stack gap={3}>
              {results ? (
                <Text muted size={1}>
                  {t('detail.documents.bulk.dialog.results-summary', {
                    failed: failedCount,
                    total: results.size,
                  })}
                </Text>
              ) : (
                <Text muted size={1}>
                  {t(`detail.documents.bulk.${action}-dialog.description`, {count: selectedCount})}
                </Text>
              )}
              {!results &&
                skippedCount > 0 && (
                  // Selected documents with no target for this action are shown as a count, never
                  // silently dropped — the editor knows the selection was larger than the target list.
                  <Text muted size={1}>
                    {t('detail.documents.bulk.dialog.skipped', {count: skippedCount})}
                  </Text>
                )}
              {!results && showMixedUnpublishNote && (
                <Text muted size={1}>
                  {t('detail.documents.bulk.unpublish-dialog.mixed-note')}
                </Text>
              )}
            </Stack>
            <Box style={{maxHeight: '50vh', overflowY: 'auto'}}>
              <Stack gap={4}>
                {bundleGroups.map((group) => {
                  const collapsed = collapsedGroups.has(group.id)
                  const allSelected = group.targets.every((tgt) => !deselectedKeys.has(tgt.key))
                  const someSelected = group.targets.some((tgt) => !deselectedKeys.has(tgt.key))
                  const effectKey = getEffectKey(action, group.kind)
                  return (
                    // One section per bundle — the "nested table": a bundle header over its rows.
                    <Stack key={group.id} gap={3}>
                      <Flex align="center" gap={2}>
                        {!results && (
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            aria-label={t('detail.documents.bulk.dialog.select-group')}
                            onChange={() => toggleGroup(group)}
                          />
                        )}
                        <Button
                          icon={collapsed ? ChevronRightIcon : ChevronDownIcon}
                          mode="bleed"
                          onClick={() => toggleCollapse(group.id)}
                          tooltipProps={{content: t('detail.documents.bulk.dialog.toggle-section')}}
                        />
                        <Text size={1} weight="semibold">
                          {group.label}
                        </Text>
                        <Text muted size={1}>
                          {group.targets.length}
                        </Text>
                        {group.scheduledAt && (
                          <Text muted size={1}>
                            <RelativeTime time={group.scheduledAt} useTemporalPhrase />
                          </Text>
                        )}
                        <Box flex={1} />
                        {effectKey && (
                          <Text muted size={1}>
                            {t(effectKey)}
                          </Text>
                        )}
                      </Flex>
                      {!collapsed && (
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
                                hasValidationError={Boolean(targetGroup.validation?.hasError)}
                                onToggle={() => toggleTarget(target.key)}
                                status={results?.get(target.key)}
                                testId={`variant-bulk-target-${target.key}`}
                                validationLabel={t(
                                  'detail.documents.bulk.dialog.validation-warning',
                                )}
                              />
                            )
                          })}
                        </Stack>
                      )}
                    </Stack>
                  )
                })}
              </Stack>
            </Box>
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
