import {Stack} from '@sanity/ui'
import {Fragment, type ReactNode} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {
  selectDatasets,
  selectSourceMapEnabled,
  selectWorkspaceDataset,
} from '../../store/visionMachine'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {SwitchField} from '../SwitchField'
import {DatasetField} from './DatasetField'
import {OPTION_FIELD_ORDER, type OptionField} from './optionFieldOrder'
import {
  ApiVersionField,
  FieldLabel,
  PerspectiveSelect,
  UseCdnField,
  usePerspectiveOptionName,
  VariantSelect,
} from './OptionFields'
import {OptionsGrid, OptionsGridToggleCell} from './OptionsGrid'

export interface OptionsPanelProps {
  options: VisionTabOptions
  resolved: ResolvedRequest
  onChange: (options: Partial<VisionTabOptions>) => void
}

export function OptionsPanel({options, resolved, onChange}: OptionsPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const datasets = useVisionSelector(selectDatasets)
  const workspaceDataset = useVisionSelector(selectWorkspaceDataset)
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const sourceMapEnabled = useVisionSelector(selectSourceMapEnabled)

  const fields: Record<OptionField, ReactNode> = {
    apiVersion: (
      <ApiVersionField
        id="vision-option-api-version"
        locked={resolved.isApiVersionLocked}
        onChange={(apiVersion) => onChange({apiVersion})}
        trackQueryChanges
        value={options.apiVersion}
      />
    ),
    dataset: (
      <DatasetField
        dataset={options.dataset}
        datasets={datasets}
        id="vision-option-dataset"
        mode={options.datasetMode}
        onChange={onChange}
        workspaceDataset={workspaceDataset}
      />
    ),
    perspective: (
      <PerspectiveSelect
        apiVersion={resolved.isApiVersionLocked ? resolved.apiVersion : options.apiVersion}
        id="vision-option-perspective"
        onChange={(perspective) => onChange({perspective})}
        value={options.perspective}
      />
    ),
    variant: (
      <VariantSelect
        id="vision-option-variant"
        onChange={(variant) => onChange({variant})}
        value={options.variant}
      />
    ),
    caching: (
      <Stack gap={2}>
        <FieldLabel>{t('vision.options.caching-label')}</FieldLabel>
        <OptionsGridToggleCell>
          <UseCdnField
            checked={options.useCdn}
            notes={resolved.isCdnAnonymous ? [t('vision.options.use-cdn.anonymous')] : []}
            onChange={(useCdn) => onChange({useCdn})}
            showSummary={false}
            testId="vision-option-use-cdn"
          />
        </OptionsGridToggleCell>
      </Stack>
    ),
    sourceMap: sourceMapEnabled && (
      <OptionsGridToggleCell wide>
        <SwitchField
          checked={options.includeSourceMap}
          info={t('vision.options.include-source-map.description')}
          onChange={(includeSourceMap) => onChange({includeSourceMap})}
          testId="vision-option-source-map"
          title={t('vision.options.include-source-map')}
        />
      </OptionsGridToggleCell>
    ),
  }

  return (
    <Box data-testid="vision-options" padding={3}>
      <Stack gap={4}>
        <OptionsGrid>
          {OPTION_FIELD_ORDER.map((field) => (
            <Fragment key={field}>{fields[field]}</Fragment>
          ))}
        </OptionsGrid>
        {resolved.isCdnBlockedByPerspective && (
          <CdnBlockedNotice
            onUsePublished={() => onChange({perspective: 'published'})}
            perspectiveName={perspectiveName}
            testId="vision-option-use-cdn-blocked"
          />
        )}
      </Stack>
    </Box>
  )
}
