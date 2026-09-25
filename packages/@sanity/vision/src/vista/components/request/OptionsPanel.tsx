import {Stack, Switch, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VistaTabOptions} from '../../store/types'
import {useVistaSelector} from '../../store/VistaActorContext'
import {selectDatasets} from '../../store/vistaMachine'
import {optionsGrid} from '../vista.css'
import {ApiVersionField, DatasetSelect, PerspectiveSelect} from './OptionFields'

export interface OptionsPanelProps {
  options: VistaTabOptions
  resolved: ResolvedRequest
  onChange: (options: Partial<VistaTabOptions>) => void
}

export function OptionsPanel({options, resolved, onChange}: OptionsPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const datasets = useVistaSelector(selectDatasets)

  return (
    <Box data-testid="vista-options" padding={3}>
      <Stack gap={4}>
        <div className={optionsGrid}>
          <DatasetSelect
            datasets={datasets}
            id="vista-option-dataset"
            onChange={(dataset) => onChange({dataset})}
            value={options.dataset}
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
        </div>
        <Flex alignItems="center" as="label" gap={3}>
          <Switch
            checked={options.includeSourceMap}
            data-testid="vista-option-source-map"
            onChange={(event) => onChange({includeSourceMap: event.currentTarget.checked})}
          />
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {t('vista.options.include-source-map')}
            </Text>
            <Text muted size={1}>
              {t('vista.options.include-source-map.description')}
            </Text>
          </Stack>
        </Flex>
      </Stack>
    </Box>
  )
}
