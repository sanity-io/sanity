import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Button, Card, Dialog, Stack, Text, TextArea} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {type KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useResolvedRequest} from '../../hooks/useResolvedRequest'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {selectActiveTab} from '../../store/vistaMachine'
import {
  type GeneratedQuery,
  generateQuery,
  GenerateQueryError,
  MAX_GENERATE_ATTEMPTS,
} from '../../util/generateQuery'
import {formatGroq} from '../../util/groqWasm'
import {summarizeSchema} from '../../util/schemaSummary'

type GenerateStatus =
  | {type: 'idle'}
  | {type: 'generating'; attempt: number}
  | {type: 'failed'; message: string; lastAttempt: GeneratedQuery | undefined}

/**
 * Writes a query from a description with Agent Actions and opens it in a new tab, which fetches
 * it. Attempts are checked with the active tab's dataset, API version and perspective, and the
 * new tab takes those options, so the query runs the way it was checked.
 */
export function GenerateQueryDialog() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const schema = useSchema() as Schema | undefined
  const activeTab = useVistaSelector(selectActiveTab)
  const {client} = useResolvedRequest(activeTab.options)
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<GenerateStatus>({type: 'idle'})
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const close = useCallback(() => actorRef.send({type: 'dialog.close'}), [actorRef])

  const open = useCallback(
    async (generated: GeneratedQuery, fetch: boolean) => {
      // Laid out like Prettify does by default; a query the formatter rejects opens as written
      const query = await formatGroq(generated.query).catch(() => generated.query)
      actorRef.send({
        type: 'tab.add',
        tab: {
          query,
          rawParams: JSON.stringify(generated.params, null, 2),
          title: generated.title,
          options: activeTab.options,
        },
        fetch,
      })
      close()
    },
    [activeTab.options, actorRef, close],
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
      await open(generated, true)
    } catch (error) {
      if (controller.signal.aborted) return
      setStatus({
        type: 'failed',
        message: error instanceof Error ? error.message : String(error),
        lastAttempt: error instanceof GenerateQueryError ? error.lastAttempt : undefined,
      })
    }
  }, [client, open, request, schema])

  const generating = status.type === 'generating'
  const lastAttempt = status.type === 'failed' ? status.lastAttempt : undefined
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (!generating) void generate()
    }
  }

  return (
    <Dialog
      animate
      data-testid="vista-generate-dialog"
      footer={
        <Flex alignItems="center" gap={3} justifyContent="flex-end" padding={3}>
          <Button mode="bleed" onClick={close} padding={2} text={t('vista.generate.cancel')} />
          <Button
            data-testid="vista-generate-submit"
            disabled={!request.trim() || generating}
            icon={SparklesIcon}
            loading={generating}
            onClick={() => void generate()}
            padding={2}
            text={t('vista.generate.submit')}
            tone="primary"
          />
        </Flex>
      }
      header={t('vista.generate.title')}
      id="vista-generate-dialog"
      onClose={close}
      width={1}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Text muted size={1}>
            {t('vista.generate.description')}
          </Text>
          <TextArea
            aria-label={t('vista.generate.label')}
            autoFocus
            data-testid="vista-generate-request"
            disabled={generating}
            fontSize={1}
            onChange={(event) => setRequest(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('vista.generate.placeholder')}
            rows={3}
            value={request}
          />
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
          {status.type === 'failed' && (
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
        </Stack>
      </Box>
    </Dialog>
  )
}
