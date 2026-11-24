import {type ContentSourceMap} from '@sanity/client'
import {Button, Stack} from '@sanity/ui'
import {useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {ResultView, type ResultViewCopy} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {type OneOffSourceMap} from '../../hooks/useOneOffSourceMap'
import {parseSourceMapDocuments} from '../../util/documentListResult'
import * as styles from '../redesign.module.css'
import {DocumentListView} from './documentList/DocumentListView'
import {ResultGraph} from './ResultGraph'
import {ResultJson} from './ResultJson'

/** The views of the Content Source Map tab, the same ones the result has */
export type SourceMapView = 'json' | 'tree' | 'graph' | 'documents'

export interface SourceMapTabProps {
  /** The response's source map, or the one the tab fetched for it */
  sourceMap: ContentSourceMap | undefined
  /** The tab's own fetch of a source map */
  oneOff: Pick<OneOffSourceMap, 'status' | 'error'>
  /** Fetches the current query once with a source map; `undefined` while there is none to run */
  onFetch: (() => void) | undefined
  /** Opens the Options tab on the "Include content source map" switch */
  onRevealOption: () => void
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
export function SourceMapTab(props: SourceMapTabProps) {
  const {sourceMap, oneOff, onFetch, onRevealOption, dataset, view, id, copy} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const documents = useMemo(
    () => (sourceMap && view === 'documents' ? parseSourceMapDocuments(sourceMap) : undefined),
    [sourceMap, view],
  )

  if (!sourceMap) {
    const fetching = oneOff.status === 'fetching'
    return (
      <Box data-testid="vision-source-map-empty" id={id} padding={3}>
        <Stack gap={4}>
          <Text muted size={1} as="div" trim={true}>
            {oneOff.status === 'done'
              ? t('vision.source-map.empty-after-fetch')
              : t('vision.source-map.empty')}
          </Text>
          <Stack gap={3}>
            <Flex>
              <Button
                data-testid="vision-source-map-fetch"
                disabled={!onFetch || fetching}
                fontSize={1}
                loading={fetching}
                mode="ghost"
                onClick={onFetch}
                padding={2}
                text={t('vision.source-map.fetch')}
              />
            </Flex>
            <Text muted size={1} as="div" trim={true}>
              {t('vision.source-map.fetch.description')}
            </Text>
            {oneOff.status === 'failed' && (
              <Text
                data-testid="vision-source-map-fetch-error"
                size={1}
                as="div"
                tone="critical"
                trim={true}
              >
                {t('vision.source-map.fetch.error', {message: oneOff.error})}
              </Text>
            )}
          </Stack>
          <Stack gap={3}>
            <Text muted size={1} as="div" trim={true}>
              {t('vision.source-map.include-hint')}
            </Text>
            <Flex>
              <Button
                data-testid="vision-source-map-show-option"
                fontSize={1}
                mode="bleed"
                onClick={onRevealOption}
                padding={2}
                text={t('vision.source-map.show-option')}
              />
            </Flex>
          </Stack>
        </Stack>
      </Box>
    )
  }

  return (
    <div className={styles.sourceMapTab} data-fill={view === 'tree' ? undefined : ''}>
      {documents ? (
        <div data-testid="vision-source-map">
          <DocumentListView datasetName={dataset} id={id} resolvePreviews parsed={documents} />
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
        <Box className={styles.treeContent} data-testid="vision-source-map" id={id} padding={3}>
          <ResultView copy={copy} data={sourceMap} datasetName={dataset} />
        </Box>
      )}
    </div>
  )
}
