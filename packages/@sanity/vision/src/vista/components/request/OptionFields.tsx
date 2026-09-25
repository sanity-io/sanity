import {Select, Stack, Text, TextInput} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ChangeEvent, Fragment, useCallback} from 'react'
import {
  getDefaultVariant,
  getVariantTitle,
  usePerspective,
  useScheduledDraftsEnabled,
  useTranslation,
} from 'sanity'
import {Box} from 'ui5'

import {API_VERSIONS} from '../../../apiVersions'
import {visionLocaleNamespace} from '../../../i18n'
import {
  hasPinnedPerspective,
  isSupportedPerspective,
  SUPPORTED_PERSPECTIVES,
  type SupportedPerspective,
} from '../../../perspectives'
import {validateApiVersion} from '../../../util/validateApiVersion'

function FieldLabel({children, htmlFor}: {children: string; htmlFor: string}) {
  return (
    <Text as="label" htmlFor={htmlFor} muted size={1} weight="medium">
      {children}
    </Text>
  )
}

interface DatasetSelectProps {
  id: string
  value: string
  datasets: readonly string[]
  onChange: (dataset: string) => void
}

export function DatasetSelect({id, value, datasets, onChange}: DatasetSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('settings.dataset-label')}</FieldLabel>
      <Select
        data-testid={`${id}-select`}
        fontSize={1}
        id={id}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.currentTarget.value)}
        padding={2}
        value={value}
      >
        {datasets.map((dataset) => (
          <option key={dataset} value={dataset}>
            {dataset}
          </option>
        ))}
      </Select>
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

interface PerspectiveSelectProps {
  id: string
  value: SupportedPerspective | undefined
  onChange: (perspective: SupportedPerspective | undefined) => void
}

export function PerspectiveSelect({id, value, onChange}: PerspectiveSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const pinnedPerspective = usePerspective()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()

  const pinnedName =
    typeof pinnedPerspective.selectedPerspective === 'object'
      ? pinnedPerspective.selectedPerspective.metadata.title
      : pinnedPerspective.selectedPerspectiveName
  const selectedVariant = getDefaultVariant(pinnedPerspective.selectedVariants)
  const variantTitle = selectedVariant
    ? getVariantTitle(selectedVariant)
    : getDefaultVariant(pinnedPerspective.selectedVariantNames)
  const pinnedLabel = [
    pinnedName,
    variantTitle ? `· ${variantTitle}` : undefined,
    hasPinnedPerspective(pinnedPerspective)
      ? `(${t('settings.perspectives.pinned-release-label')})`
      : t('settings.perspectives.pinned-release-label'),
  ]
    .filter((part) => typeof part !== 'undefined')
    .join(' ')

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={id}>{t('settings.perspective-label')}</FieldLabel>
      <Select
        data-testid={`${id}-select`}
        fontSize={1}
        id={id}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const next = event.currentTarget.value
          onChange(isSupportedPerspective(next) ? next : undefined)
        }}
        padding={2}
        value={value || 'default'}
      >
        {SUPPORTED_PERSPECTIVES.map((perspectiveName) => {
          if (perspectiveName === 'pinnedRelease') {
            return (
              <Fragment key="pinnedRelease">
                <option disabled={!hasPinnedPerspective(pinnedPerspective)} value="pinnedRelease">
                  {pinnedLabel}
                </option>
                <option value="default">{t('settings.perspectives.default')}</option>
                <hr />
              </Fragment>
            )
          }
          if (perspectiveName === 'scheduledDrafts') {
            if (!isScheduledDraftsEnabled) return null
            return (
              <option key="scheduledDrafts" value="scheduledDrafts">
                {t('settings.perspectives.scheduled-drafts')}
              </option>
            )
          }
          return (
            <option key={perspectiveName} value={perspectiveName}>
              {perspectiveName}
            </option>
          )
        })}
      </Select>
    </Stack>
  )
}
