import {useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box} from 'ui5'

import {ResultView, type ResultViewCopy} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {type VisionResponseMeta} from '../../store/types'
import {parseSourceMapDocuments} from '../../util/documentListResult'
import * as styles from '../redesign.module.css'
import {DocumentListView} from './documentList/DocumentListView'
import {ResultGraph} from './ResultGraph'
import {ResultJson} from './ResultJson'

/** The views of the Content Source Map tab, the same ones the result has */
export type SourceMapView = 'json' | 'tree' | 'graph' | 'documents'

export interface SourceMapTabProps {
  meta: VisionResponseMeta | undefined
  dataset: string
  view: SourceMapView
  /** Id of the element showing the source map, which the view menu controls */
  id: string
  copy: ResultViewCopy
}

/**
 * The response's Content Source Map. JSON, Tree and Graph show the whole source map, and
 * Documents lists the documents it maps the result to, whether or not the result projected their
 * `_id` and `_type`.
 */
export function SourceMapTab({meta, dataset, view, id, copy}: SourceMapTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const sourceMap = meta?.resultSourceMap
  const documents = useMemo(
    () => (sourceMap && view === 'documents' ? parseSourceMapDocuments(sourceMap) : undefined),
    [sourceMap, view],
  )

  if (!sourceMap) {
    return (
      <Box id={id} padding={3}>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.source-map.empty')}
        </Text>
      </Box>
    )
  }

  if (documents) {
    return (
      <div className={styles.panelFillView} data-testid="vision-source-map">
        <DocumentListView datasetName={dataset} flush id={id} parsed={documents} />
      </div>
    )
  }

  if (view === 'json' || view === 'graph') {
    return (
      <div className={styles.panelFillView} data-testid="vision-source-map">
        {view === 'json' ? (
          <ResultJson id={id} value={sourceMap} />
        ) : (
          <ResultGraph copy={copy} id={id} value={sourceMap} />
        )}
      </div>
    )
  }

  return (
    <Box data-testid="vision-source-map" id={id} padding={3}>
      <ResultView copy={copy} data={sourceMap} datasetName={dataset} />
    </Box>
  )
}
