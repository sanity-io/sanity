import {type ReactNode, useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

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
  /** Picks the view, on a row of its own above it. Not shown while there is no source map. */
  viewMenu: ReactNode
  /** Id of the element showing the source map, which the view menu controls */
  id: string
  copy: ResultViewCopy
}

/**
 * The response's Content Source Map. JSON, Tree and Graph show the whole source map, and
 * Documents lists the documents it maps the result to, whether or not the result projected their
 * `_id` and `_type`.
 */
export function SourceMapTab({meta, dataset, view, viewMenu, id, copy}: SourceMapTabProps) {
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

  return (
    <div className={styles.sourceMapTab} data-fill={view === 'tree' ? undefined : ''}>
      <Flex
        alignItems="center"
        className={styles.sourceMapToolbar}
        data-testid="vision-source-map-toolbar"
        padding={2}
      >
        {viewMenu}
      </Flex>
      {documents ? (
        <div data-testid="vision-source-map">
          <DocumentListView
            datasetName={dataset}
            flush
            id={id}
            resolvePreviews
            parsed={documents}
          />
        </div>
      ) : view === 'json' ? (
        <div data-testid="vision-source-map">
          <ResultJson id={id} value={sourceMap} />
        </div>
      ) : view === 'graph' ? (
        <div data-testid="vision-source-map">
          <ResultGraph copy={copy} id={id} value={sourceMap} />
        </div>
      ) : (
        <Box data-testid="vision-source-map" id={id} padding={3}>
          <ResultView copy={copy} data={sourceMap} datasetName={dataset} />
        </Box>
      )}
    </div>
  )
}
