import {type SanityClient} from '@sanity/client'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {reportAiCreditsGranted, reportAiCreditsLimit, useAiCredits} from '../../hooks/useAiCredits'
import {type VistaTab} from '../../store/types'
import {useVistaActor} from '../../store/VistaActorContext'
import {type AiCredits, readAiCreditsLimit} from '../../util/aiCredits'
import {
  type GeneratedQuery,
  generateQuery,
  GenerateQueryError,
  MAX_GENERATE_ATTEMPTS,
} from '../../util/generateQuery'
import {summarizeSchema} from '../../util/schemaSummary'
import {AiCreditsStatus} from '../AiCreditsStatus'
import {PromptRow} from '../PromptRow'

type GenerateStatus =
  | {type: 'idle'}
  | {type: 'generating'; attempt: number}
  | {
      type: 'failed'
      message: string
      lastAttempt: GeneratedQuery | undefined
      /** The credits the request was turned down for, when that is what failed */
      limit: AiCredits | undefined
    }

export interface GenerateQueryBarProps {
  tab: VistaTab
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /** Formats the generated query for the query editor, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
  onClose: () => void
}

/**
 * Writes a query from a description with Agent Actions, above the query editor. The query
 * replaces the tab's query and params, and runs.
 */
export function GenerateQueryBar({tab, client, formatForEditor, onClose}: GenerateQueryBarProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const schema = useSchema() as Schema | undefined
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<GenerateStatus>({type: 'idle'})
  const controllerRef = useRef<AbortController | null>(null)
  const credits = useAiCredits(client)

  useEffect(() => () => controllerRef.current?.abort(), [])

  // The editors replace their content in one undoable step, so undo brings back what the tab had;
  // the query is formatted first so that step is the only one. Undo does not bring back a title,
  // so only an empty tab without one is named after the description: a title the tab was given
  // stays, and one derived from its query goes on following the query.
  const open = useCallback(
    async (generated: GeneratedQuery, fetch: boolean, signal?: AbortSignal) => {
      const query = await formatForEditor(generated.query).catch(() => generated.query)
      if (signal?.aborted) return
      const named = tab.title === undefined && !tab.query.trim()
      actorRef.send({
        type: 'tab.load',
        id: tab.id,
        tab: {
          query,
          rawParams: JSON.stringify(generated.params, null, 2),
          ...(named ? {title: generated.title} : {}),
        },
        fetch: fetch ? 'generated' : undefined,
      })
      onClose()
    },
    [actorRef, formatForEditor, onClose, tab.id, tab.query, tab.title],
  )

  const generate = useCallback(async () => {
    const description = request.trim()
    if (!description) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus({type: 'generating', attempt: 1})
    try {
      const generated = await generateQuery({
        request: description,
        schema: schema ? summarizeSchema(schema, description) : '',
        client,
        signal: controller.signal,
        onAttempt: (attempt) => setStatus({type: 'generating', attempt}),
      })
      reportAiCreditsGranted(client)
      await open(generated, true, controller.signal)
    } catch (error) {
      if (controller.signal.aborted) return
      const limit = readAiCreditsLimit(error)
      if (limit) reportAiCreditsLimit(client, limit)
      setStatus({
        type: 'failed',
        message: error instanceof Error ? error.message : String(error),
        lastAttempt: error instanceof GenerateQueryError ? error.lastAttempt : undefined,
        limit,
      })
    }
  }, [client, open, request, schema])

  const generating = status.type === 'generating'
  const lastAttempt = status.type === 'failed' ? status.lastAttempt : undefined
  // The credits as the failed request reported them, or as last read while nothing is going on
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Card borderBottom data-testid="vista-generate-bar" padding={2}>
      <Stack gap={2}>
        <PromptRow
          label={t('vista.generate.label')}
          onChange={setRequest}
          onClose={onClose}
          onSubmit={() => void generate()}
          pending={generating}
          placeholder={t('vista.generate.placeholder')}
          testIdPrefix="vista-generate"
          value={request}
        />
        {status.type === 'idle' && !atLimit && (
          <Text muted size={0}>
            {t('vista.generate.description')}
          </Text>
        )}
        {status.type === 'generating' && (
          <Text data-testid="vista-generate-progress" muted size={1}>
            {status.attempt > 1
              ? t('vista.generate.progress-retry', {
                  attempt: status.attempt,
                  max: MAX_GENERATE_ATTEMPTS,
                })
              : t('vista.generate.progress')}
          </Text>
        )}
        {status.type === 'failed' && !atLimit && (
          <Card data-testid="vista-generate-error" padding={3} radius={2} tone="critical">
            <Stack gap={3}>
              <Text size={1} weight="medium">
                {t('vista.generate.failed')}
              </Text>
              <Text size={1}>{status.message}</Text>
              {lastAttempt && (
                <>
                  <Code size={1}>{lastAttempt.query}</Code>
                  <Flex>
                    <Button
                      data-testid="vista-generate-open-anyway"
                      fontSize={1}
                      mode="ghost"
                      onClick={() => void open(lastAttempt, false)}
                      padding={2}
                      text={t('vista.generate.open-anyway')}
                    />
                  </Flex>
                </>
              )}
            </Stack>
          </Card>
        )}
        <AiCreditsStatus apiHost={client.config().apiHost} credits={shownCredits} size={0} />
      </Stack>
    </Card>
  )
}
