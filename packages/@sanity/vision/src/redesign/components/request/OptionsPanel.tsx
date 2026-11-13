import {Stack} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectDatasets, selectWorkspaceDataset} from '../../store/visionMachine'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import * as styles from '../redesign.module.css'
import {SwitchField} from '../SwitchField'
import {
  ApiVersionField,
  DatasetField,
  PerspectiveSelect,
  UseCdnField,
  usePerspectiveOptionName,
  VariantSelect,
} from './OptionFields'

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

  return (
    <Box data-testid="vision-options" padding={3}>
      <Stack gap={4}>
        <div className={styles.optionsGrid}>
          <DatasetField
            dataset={options.dataset}
            datasets={datasets}
            id="vision-option-dataset"
            mode={options.datasetMode}
            onChange={onChange}
            workspaceDataset={workspaceDataset}
          />
          <ApiVersionField
            id="vision-option-api-version"
            locked={resolved.isApiVersionLocked}
            onChange={(apiVersion) => onChange({apiVersion})}
            value={options.apiVersion}
          />
          <PerspectiveSelect
            id="vision-option-perspective"
            onChange={(perspective) => onChange({perspective})}
            value={options.perspective}
          />
          <VariantSelect
            id="vision-option-variant"
            onChange={(variant) => onChange({variant})}
            value={options.variant}
          />
        </div>
        <SwitchField
          checked={options.includeSourceMap}
          description={t('vision.options.include-source-map.description')}
          onChange={(includeSourceMap) => onChange({includeSourceMap})}
          testId="vision-option-source-map"
          title={t('vision.options.include-source-map')}
        />
        <UseCdnField
          checked={options.useCdn}
          notes={resolved.isCdnAnonymous ? [t('vision.options.use-cdn.anonymous')] : []}
          onChange={(useCdn) => onChange({useCdn})}
          testId="vision-option-use-cdn"
        />
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
