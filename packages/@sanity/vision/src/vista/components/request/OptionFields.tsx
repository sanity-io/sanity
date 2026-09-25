import {PinIcon} from '@sanity/icons/Pin'
import {PinRemovedIcon} from '@sanity/icons/PinRemoved'
import {Button, Select, Stack, Text, TextInput} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ChangeEvent, useCallback} from 'react'
import {
  getDefaultVariant,
  getVariantTitle,
  usePerspective,
  useScheduledDraftsEnabled,
  useTranslation,
  useWorkspace,
} from 'sanity'
import {Box, Flex} from 'ui5'

import {API_VERSIONS} from '../../../apiVersions'
import {visionLocaleNamespace} from '../../../i18n'
import {validateApiVersion} from '../../../util/validateApiVersion'
import {
  type VistaDatasetMode,
  type VistaPerspective,
  type VistaVariantMode,
} from '../../store/types'
import {getEffectivePerspective} from '../../util/tabPerspective'

function FieldLabel({children, htmlFor}: {children: string; htmlFor: string}) {
  return (
    <Text as="label" htmlFor={htmlFor} muted size={1} weight="medium">
      {children}
    </Text>
  )
}

/** The perspectives a tab can pick by hand, in menu order; `global` and the API default come first */
const OWN_PERSPECTIVES = ['raw', 'published', 'drafts'] as const

interface DatasetFieldProps {
  id: string
  mode: VistaDatasetMode
  /** The pinned dataset, shown (and pinned from) while following the workspace */
  dataset: string
  workspaceDataset: string
  datasets: readonly string[]
  onChange: (options: {datasetMode: VistaDatasetMode; dataset: string}) => void
}

/**
 * The dataset follows the workspace until one is pinned: pinning starts from the workspace's
 * dataset and enables the select, unpinning follows the workspace again.
 */
export function DatasetField({
  id,
  mode,
  dataset,
  workspaceDataset,
  datasets,
  onChange,
}: DatasetFieldProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const following = mode === 'workspace'
  const toggleLabel = following
    ? t('vista.options.dataset.pin')
    : t('vista.options.dataset.use-workspace')

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('settings.dataset-label')}</FieldLabel>
      <Flex gap={1}>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <Select
            data-testid={`${id}-select`}
            disabled={following}
            fontSize={1}
            id={id}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange({datasetMode: 'pinned', dataset: event.currentTarget.value})
            }
            padding={2}
            value={following ? workspaceDataset : dataset}
          >
            {datasets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Box>
        <Tooltip content={<Text size={1}>{toggleLabel}</Text>} placement="bottom" portal>
          <Button
            aria-label={toggleLabel}
            aria-pressed={!following}
            data-testid={`${id}-${following ? 'pin' : 'follow'}`}
            fontSize={1}
            icon={following ? PinIcon : PinRemovedIcon}
            mode="ghost"
            onClick={() =>
              onChange(
                following
                  ? {datasetMode: 'pinned', dataset: workspaceDataset}
                  : {datasetMode: 'workspace', dataset},
              )
            }
            padding={2}
          />
        </Tooltip>
      </Flex>
      <Text muted size={0}>
        {following
          ? t('vista.options.dataset.follows-workspace')
          : t('vista.options.dataset.pinned')}
      </Text>
    </Stack>
  )
}

interface ApiVersionFieldProps {
  id: string
  /** Any version; one not in `API_VERSIONS` shows up in the "Other" input */
  value: string
  /** Locked to `vX` while a variant is selected in the navbar */
  locked: boolean
  onChange: (apiVersion: string) => void
}

export function ApiVersionField({id, value, locked, onChange}: ApiVersionFieldProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const isCustom = !API_VERSIONS.includes(value)
  const isValid = validateApiVersion(value)

  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value
      // Start the "Other" input with the prefix, so the API version is typed the way it is sent
      onChange(next === 'other' ? 'v' : next)
    },
    [onChange],
  )

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('settings.api-version-label')}</FieldLabel>
      <Tooltip
        content={<Text size={1}>{t('settings.api-version-locked-for-variant')}</Text>}
        disabled={!locked}
        placement="bottom"
        portal
      >
        <Box data-testid={`${id}-wrap`}>
          <Select
            data-testid={`${id}-select`}
            disabled={locked}
            fontSize={1}
            id={id}
            onChange={handleSelect}
            padding={2}
            value={locked ? 'vX' : isCustom ? 'other' : value}
          >
            {API_VERSIONS.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
            <option value="other">{t('settings.other-api-version-label')}</option>
          </Select>
        </Box>
      </Tooltip>
      {!locked && isCustom && (
        <TextInput
          aria-label={t('settings.custom-api-version-label')}
          customValidity={isValid ? undefined : t('settings.error.invalid-api-version')}
          data-testid={`${id}-custom`}
          fontSize={1}
          maxLength={11}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.currentTarget.value || 'v')
          }
          padding={2}
          placeholder="v2025-02-19"
          value={value}
        />
      )}
    </Stack>
  )
}

/** What the navbar's perspective is called right now: a release title, published, or drafts */
function useGlobalPerspectiveName(): string {
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const isDraftModelEnabled = useWorkspace().document.drafts.enabled
  const releaseTitle =
    typeof selectedPerspective === 'object' ? selectedPerspective.metadata.title : undefined
  return releaseTitle ?? selectedPerspectiveName ?? (isDraftModelEnabled ? 'drafts' : 'published')
}

interface PerspectiveSelectProps {
  id: string
  value: VistaPerspective
  onChange: (perspective: VistaPerspective) => void
}

export function PerspectiveSelect({id, value, onChange}: PerspectiveSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const globalName = useGlobalPerspectiveName()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  // Shows what the request runs with: a stored scheduled drafts choice reads as Global where
  // this workspace has no scheduled drafts, and the option is not listed
  const shownValue = getEffectivePerspective(value, isScheduledDraftsEnabled)

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('settings.perspective-label')}</FieldLabel>
      <Select
        data-testid={`${id}-select`}
        fontSize={1}
        id={id}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const next = event.currentTarget.value
          onChange(next === 'default' ? undefined : (next as Exclude<VistaPerspective, undefined>))
        }}
        padding={2}
        value={shownValue ?? 'default'}
      >
        <option value="global">{t('vista.options.perspective.global', {name: globalName})}</option>
        <option value="default">{t('settings.perspectives.default')}</option>
        <hr />
        {OWN_PERSPECTIVES.map((perspective) => (
          <option key={perspective} value={perspective}>
            {perspective}
          </option>
        ))}
        {isScheduledDraftsEnabled && (
          <option value="scheduledDrafts">{t('settings.perspectives.scheduled-drafts')}</option>
        )}
      </Select>
    </Stack>
  )
}

interface VariantSelectProps {
  id: string
  value: VistaVariantMode
  onChange: (variant: VistaVariantMode) => void
}

/** Sends the navbar's variant with the query, or none; picking another variant is not offered here */
export function VariantSelect({id, value, onChange}: VariantSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {selectedVariants, selectedVariantNames} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)
  const globalVariantName = selectedVariant
    ? getVariantTitle(selectedVariant)
    : getDefaultVariant(selectedVariantNames)

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('vista.options.variant-label')}</FieldLabel>
      <Select
        data-testid={`${id}-select`}
        fontSize={1}
        id={id}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.currentTarget.value === 'none' ? 'none' : 'global')
        }
        padding={2}
        value={value}
      >
        <option value="global">
          {globalVariantName
            ? t('vista.options.variant.global', {name: globalVariantName})
            : t('vista.options.variant.global-none')}
        </option>
        <option value="none">{t('vista.options.variant.none')}</option>
      </Select>
    </Stack>
  )
}
