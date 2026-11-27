import {type SanityClient} from '@sanity/client'
import {Button, Card, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {type Schema, useSchema} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../../i18n'
import {useAiCredits} from '../../../hooks/useAiCredits'
import {type QueryAgent} from '../../../hooks/useQueryAgent'
import {type VisionTab} from '../../../store/types'
import {describeDocumentListFields} from '../../../util/documentListFields'
import {
  describeDocumentListResult,
  getMissingRowFields,
  getRowTypes,
  type ParsedDocumentList,
} from '../../../util/documentListResult'
import {getDocumentTypeNames} from '../../../util/documentTypes'
import {fitQueryToDocumentList, MAX_GENERATE_ATTEMPTS} from '../../../util/generateQuery'
import {getRequestedDocumentTypes, summarizeSchema} from '../../../util/schemaSummary'
import {AgentActionsTooltip} from '../../AgentActionsTooltip'
import {AnimatedSparklesIcon} from '../../request/AnimatedSparklesIcon'

/** As many types as the schema summary details */
const MAX_LISTED_TYPES = 6

export interface FitDocumentListQueryProps {
  tab: VisionTab
  /** The tab's params, which the change starts from */
  params: Record<string, unknown> | undefined
  /** The result the Documents view shows, which the query returned */
  result: unknown
  parsed: ParsedDocumentList
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /**
   * The request's state lives above this component, which unmounts with the Documents view while
   * the changed query runs, and a request still running then has to finish and load
   */
  agent: QueryAgent
}

/**
 * The document types whose previews say what a row shows: the types the rows name, then the
 * ones the query mentions (a result without `_type` still has a filter that names them)
 */
function getListedTypes(schema: Schema, query: string, parsed: ParsedDocumentList): string[] {
  const documentTypes = new Set(getDocumentTypeNames(schema))
  const names = new Set([...getRowTypes(parsed), ...getRequestedDocumentTypes(schema, query)])
  return [...names].filter((name) => documentTypes.has(name)).slice(0, MAX_LISTED_TYPES)
}

/**
 * "Update query with AI" in the Documents view: has Agent Actions change the tab's query so that
 * its result lists documents with `_id`, `_type`, `title`, `subtitle` and `media`, as Edit makes
 * a described change. The changed query replaces the tab's query and params, and runs.
 */
export function FitDocumentListQuery({
  tab,
  params,
  result,
  parsed,
  client,
  agent,
}: FitDocumentListQueryProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const credits = useAiCredits(client)
  const telemetry = useVisionTelemetry()
  const {status, run, openLastAttempt} = agent

  const fit = useCallback(() => {
    telemetry.agentAction('fit-document-list')
    const types = schema ? getListedTypes(schema, tab.query, parsed) : []
    void run(
      (request) =>
        fitQueryToDocumentList({
          ...request,
          query: tab.query,
          params: params ?? {},
          result: describeDocumentListResult(result, parsed),
          listFields: schema ? describeDocumentListFields(schema, types) : undefined,
          schema: schema ? summarizeSchema(schema, `${tab.query}\n${types.join(' ')}`) : '',
        }),
      {comment: false, keepParams: params === undefined, ai: {action: 'fit-document-list'}},
    )
  }, [params, parsed, result, run, schema, tab.query, telemetry])

  const running = status.type === 'running'
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Stack data-testid="vision-fit-document-list" gap={3}>
      <Flex alignItems="center" gap={3}>
        <AgentActionsTooltip>
          <Button
            data-testid="vision-fit-document-list-button"
            disabled={running || atLimit}
            fontSize={1}
            icon={AnimatedSparklesIcon}
            loading={running}
            onClick={fit}
            padding={2}
            text={t('vision.result.documents.fit')}
            tone="primary"
          />
        </AgentActionsTooltip>
        {running ? (
          <Text data-testid="vision-fit-document-list-progress" muted size={1} as="div">
            {status.attempt > 1
              ? t('vision.generate.progress-retry', {
                  attempt: status.attempt,
                  max: MAX_GENERATE_ATTEMPTS,
                })
              : t('vision.result.documents.fit.progress')}
          </Text>
        ) : (
          status.type === 'idle' &&
          !atLimit && (
            <Text muted size={1} as="div">
              {parsed.ok
                ? t('vision.result.documents.fit.description', {
                    fields: getMissingRowFields(parsed.documents).join(', '),
                  })
                : t('vision.result.documents.fit.description-invalid')}
            </Text>
          )
        )}
      </Flex>
      {status.type === 'failed' && !atLimit && (
        <Card data-testid="vision-fit-document-list-error" padding={3} radius={2} tone="critical">
          <Stack gap={3}>
            <Text size={1} weight="medium" as="div" trim={true} tone="critical">
              {t('vision.result.documents.fit.failed')}
            </Text>
            <Text size={1} as="div" trim={true} tone="critical">
              {status.message}
            </Text>
            {status.lastAttempt && (
              <Flex>
                <Button
                  data-testid="vision-fit-document-list-open-anyway"
                  fontSize={1}
                  mode="ghost"
                  onClick={openLastAttempt}
                  padding={2}
                  text={t('vision.generate.open-anyway')}
                />
              </Flex>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
