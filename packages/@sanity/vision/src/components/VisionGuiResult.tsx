import {type ClientPerspective, type MutationEvent} from '@sanity/client'
import {Text} from '@sanity/ui'
import {Translate, useTranslation} from 'sanity'
import {Box} from 'ui5'

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
  apiVersion: string
  perspective: ClientPerspective | undefined
  variant: string | undefined
  queryInProgress: boolean
  queryResult?: unknown | undefined
  listenInProgress: boolean
  listenMutations: MutationEvent[]
  dataset: string
  queryTime: number | undefined
  e2eTime: number | undefined
  compactFooter?: boolean
}

export function VisionGuiResult({
  error,
  apiVersion,
  perspective,
  variant,
  queryInProgress,
  queryResult,
  listenInProgress,
  listenMutations,
  dataset,
  queryTime,
  e2eTime,
  compactFooter = false,
}: VisionGuiResultProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const hasResult = !error && !queryInProgress && typeof queryResult !== 'undefined'

  return (
    <ResultOuterContainer direction="column" data-testid="vision-result">
      <ResultInnerContainer flexBasis="0%" flexGrow={1}>
        <ResultContainer
          flex={1}
          overflow="hidden"
          tone={error ? 'critical' : 'default'}
          isInvalid={Boolean(error)}
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
              {error && (
                <QueryErrorDialog
                  apiVersion={apiVersion}
                  error={error}
                  perspective={perspective}
                  variant={variant}
                />
              )}
              {hasResult && <ResultView data={queryResult} datasetName={dataset} />}
              {listenInProgress && listenMutations.length > 0 && (
                <ResultView data={listenMutations} datasetName={dataset} />
              )}
            </Box>
          </Result>
        </ResultContainer>
      </ResultInnerContainer>
      {/* Execution time */}
      <ResultFooter
        justify={compactFooter ? 'flex-start' : 'space-between'}
        align={compactFooter ? 'stretch' : undefined}
        direction={compactFooter ? 'column' : ['column', 'column', 'row']}
      >
        <TimingsCard
          paddingX={compactFooter ? 3 : 4}
          paddingY={compactFooter ? 2 : 3}
          sizing="border"
          style={compactFooter ? {width: '100%'} : {minWidth: 0}}
        >
          <TimingsTextContainer align="center">
            <Box>
              <Text muted size={compactFooter ? 1 : 2}>
                {t('result.execution-time-label')}:{' '}
                {typeof queryTime === 'number'
                  ? `${queryTime}ms`
                  : t('result.timing-not-applicable')}
              </Text>
            </Box>
            <Box marginLeft={compactFooter ? 3 : 4}>
              <Text muted size={compactFooter ? 1 : 2}>
                {t('result.end-to-end-time-label')}:{' '}
                {typeof e2eTime === 'number' ? `${e2eTime}ms` : t('result.timing-not-applicable')}
              </Text>
            </Box>
          </TimingsTextContainer>
        </TimingsCard>

        {hasResult && (
          <DownloadsCard
            paddingX={compactFooter ? 3 : 4}
            paddingY={compactFooter ? 2 : 3}
            sizing="border"
            style={compactFooter ? {width: '100%'} : {marginLeft: 'auto', minWidth: 0}}
          >
            <SaveResultLabel muted size={compactFooter ? 1 : 2}>
              <Translate
                components={{SaveResultButtons}}
                componentProps={{queryResult}}
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

function SaveResultButtons({queryResult}: {queryResult: unknown}) {
  // This only renders when `hasResult` is true, and falsy values like `null`, `0`, `false` or ''
  // are valid GROQ results — the resolvers themselves return `undefined` for non-encodable input.
  const jsonUrl = getJsonBlobUrl(queryResult)
  const csvUrl = getCsvBlobUrl(queryResult)

  return (
    <>
      <SaveJsonButton blobUrl={jsonUrl} />
      <SaveCsvButton blobUrl={csvUrl} />
    </>
  )
}
