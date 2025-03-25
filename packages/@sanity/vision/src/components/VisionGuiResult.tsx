/* eslint-disable complexity */
import {type MutationEvent} from '@sanity/client'
import {Box, Text} from '@sanity/ui'
import {Translate, useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'
import {getCsvBlobUrl, getJsonBlobUrl} from '../util/getBlobUrl'
import {DelayedSpinner} from './DelayedSpinner'
import {QueryErrorDialog} from './QueryErrorDialog'
import {ResultView} from './ResultView'
import {SaveCsvButton, SaveJsonButton} from './SaveResultButtons'
import {
  DownloadsCard,
  InputBackgroundContainer,
  Result,
  ResultContainer,
  ResultFooter,
  ResultInnerContainer,
  ResultOuterContainer,
  SaveResultLabel,
  StyledLabel,
  TimingsCard,
  TimingsTextContainer,
} from './VisionGui.styled'

interface VisionGuiResultProps {
  error?: Error | undefined
  queryInProgress: boolean
  queryResult?: unknown | undefined
  listenInProgress: boolean
  listenMutations: MutationEvent[]
  dataset: string
  queryTime: number | undefined
  e2eTime: number | undefined
}

export function VisionGuiResult({
  error,
  queryInProgress,
  queryResult,
  listenInProgress,
  listenMutations,
  dataset,
  queryTime,
  e2eTime,
}: VisionGuiResultProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const hasResult = !error && !queryInProgress && typeof queryResult !== 'undefined'

  const jsonUrl = hasResult ? getJsonBlobUrl(queryResult) : ''
  const csvUrl = hasResult ? getCsvBlobUrl(queryResult) : ''

  return (
    <ResultOuterContainer direction="column" data-testid="vision-result">
      <ResultInnerContainer flex={1}>
        <ResultContainer
          flex={1}
          overflow="hidden"
          tone={error ? 'critical' : 'default'}
          $isInvalid={Boolean(error)}
        >
          <Result overflow="auto">
            <InputBackgroundContainer>
              <Box marginLeft={3}>
                <StyledLabel muted>{t('result.label')}</StyledLabel>
              </Box>
            </InputBackgroundContainer>
            <Box padding={3} paddingTop={5}>
              {(queryInProgress || (listenInProgress && listenMutations.length === 0)) && (
                <Box marginTop={3}>
                  <DelayedSpinner />
                </Box>
              )}
              {error && <QueryErrorDialog error={error} />}
              {hasResult && <ResultView data={queryResult} datasetName={dataset} />}
              {listenInProgress && listenMutations.length > 0 && (
                <ResultView data={listenMutations} datasetName={dataset} />
              )}
            </Box>
          </Result>
        </ResultContainer>
      </ResultInnerContainer>
      {/* Execution time */}
      <ResultFooter justify="space-between" direction={['column', 'column', 'row']}>
        <TimingsCard paddingX={4} paddingY={3} sizing="border">
          <TimingsTextContainer align="center">
            <Box>
              <Text muted>
                {t('result.execution-time-label')}:{' '}
                {typeof queryTime === 'number'
                  ? `${queryTime}ms`
                  : t('result.timing-not-applicable')}
              </Text>
            </Box>
            <Box marginLeft={4}>
              <Text muted>
                {t('result.end-to-end-time-label')}:{' '}
                {typeof e2eTime === 'number' ? `${e2eTime}ms` : t('result.timing-not-applicable')}
              </Text>
            </Box>
          </TimingsTextContainer>
        </TimingsCard>

        {hasResult && (
          <DownloadsCard paddingX={4} paddingY={3} sizing="border">
            <SaveResultLabel muted>
              <Translate
                components={{
                  SaveResultButtons: () => (
                    <>
                      <SaveJsonButton blobUrl={jsonUrl} />
                      <SaveCsvButton blobUrl={csvUrl} />
                    </>
                  ),
                }}
                i18nKey="result.save-result-as-format"
                t={t}
              />
            </SaveResultLabel>
          </DownloadsCard>
        )}
      </ResultFooter>
    </ResultOuterContainer>
  )
}
