import {Stack} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VistaTabOptions} from '../../store/types'
import {useVistaSelector} from '../../store/VistaActorContext'
import {selectDatasets, selectWorkspaceDataset} from '../../store/vistaMachine'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {SwitchField} from '../SwitchField'
import * as styles from '../vista.module.css'
import {
  ApiVersionField,
  DatasetField,
  PerspectiveSelect,
  UseCdnField,
  usePerspectiveOptionName,
  VariantSelect,
} from './OptionFields'

export interface OptionsPanelProps {
  options: VistaTabOptions
  resolved: ResolvedRequest
  onChange: (options: Partial<VistaTabOptions>) => void
}

export function OptionsPanel({options, resolved, onChange}: OptionsPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const datasets = useVistaSelector(selectDatasets)
  const workspaceDataset = useVistaSelector(selectWorkspaceDataset)
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)

  return (
    <Box data-testid="vista-options" padding={3}>
      <Stack gap={4}>
        <div className={styles.optionsGrid}>
          <DatasetField
            dataset={options.dataset}
            datasets={datasets}
            id="vista-option-dataset"
            mode={options.datasetMode}
            onChange={onChange}
            workspaceDataset={workspaceDataset}
          />
          <ApiVersionField
            id="vista-option-api-version"
            locked={resolved.isApiVersionLocked}
            onChange={(apiVersion) => onChange({apiVersion})}
            value={options.apiVersion}
          />
          <PerspectiveSelect
            id="vista-option-perspective"
            onChange={(perspective) => onChange({perspective})}
            value={options.perspective}
          />
          <VariantSelect
            id="vista-option-variant"
            onChange={(variant) => onChange({variant})}
            value={options.variant}
          />
        </div>
        <SwitchField
          checked={options.includeSourceMap}
          description={t('vista.options.include-source-map.description')}
          onChange={(includeSourceMap) => onChange({includeSourceMap})}
          testId="vista-option-source-map"
          title={t('vista.options.include-source-map')}
        />
        <UseCdnField
          checked={options.useCdn}
          notes={resolved.isCdnAnonymous ? [t('vista.options.use-cdn.anonymous')] : []}
          onChange={(useCdn) => onChange({useCdn})}
          testId="vista-option-use-cdn"
        />
        {resolved.isCdnBlockedByPerspective && (
          <CdnBlockedNotice
            onUsePublished={() => onChange({perspective: 'published'})}
            perspectiveName={perspectiveName}
            testId="vista-option-use-cdn-blocked"
          />
        )}
      </Stack>
    </Box>
  )
}
