import {Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box} from 'ui5'

import {ResultView} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {type VistaResponseMeta} from '../../store/types'

export interface SourceMapTabProps {
  meta: VistaResponseMeta | undefined
  dataset: string
}

export function SourceMapTab({meta, dataset}: SourceMapTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)

  if (!meta?.resultSourceMap) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          {t('vista.source-map.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Box data-testid="vista-source-map" padding={3}>
      <ResultView data={meta.resultSourceMap} datasetName={dataset} />
    </Box>
  )
}
