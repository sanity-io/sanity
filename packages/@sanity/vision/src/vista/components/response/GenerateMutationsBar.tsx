import {Button, Card, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {reportAiCreditsGranted, reportAiCreditsLimit, useAiCredits} from '../../hooks/useAiCredits'
import {type AiCredits, type AiCreditsClient, readAiCreditsLimit} from '../../util/aiCredits'
import {
  type GenerateMutationsClient,
  generateMutations,
  GenerateMutationsError,
} from '../../util/generateMutations'
import {MAX_GENERATE_ATTEMPTS} from '../../util/generateQuery'
import {
  documentsInResult,
  type MutationBody,
  type MutationOptions,
  type MutationPreview,
  mutationRunKey,
} from '../../util/mutations'
import {summarizeSchema} from '../../util/schemaSummary'
import {AiCreditsStatus} from '../AiCreditsStatus'
import {useAiCreditsUpsell} from '../AiCreditsUpsellContext'
import {PromptRow} from '../PromptRow'

type GenerateStatus =
  | {type: 'idle'}
  | {type: 'generating'; attempt: number}
  | {
      type: 'failed'
      message: string
      lastAttempt: MutationBody[] | undefined
      /** The credits the request was turned down for, when that is what failed */
      limit: AiCredits | undefined
    }

export interface GenerateMutationsBarProps {
  /** The client of the dataset the mutations go to; it dry-runs each attempt */
  client: GenerateMutationsClient & AiCreditsClient
  dataset: string
  /** The result shown, whose documents the description can call "these documents" */
  result: unknown
  /** What the dry runs send along, as Apply would */
  mutationOptions: MutationOptions
  /** The mutations and the dry run that checked them, keyed by what it ran */
  onGenerated: (text: string, preview: {key: string; result: MutationPreview}) => void
  /** Puts mutations the dry run turned down in the editor, to fix by hand */
  onOpenAttempt: (text: string) => void
  onClose: () => void
}

function toText(mutations: MutationBody[]): string {
  return JSON.stringify(mutations, null, 2)
}

/**
 * Writes mutations from a description with Agent Actions, above the mutations editor. The
 * documents of the shown result are the ones the description can refer to, and every attempt is
 * dry-run, which writes nothing, so what it would change shows straight away.
 */
export function GenerateMutationsBar(props: GenerateMutationsBarProps) {
  const {client, dataset, result, mutationOptions, onGenerated, onOpenAttempt, onClose} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<GenerateStatus>({type: 'idle'})
  const controllerRef = useRef<AbortController | null>(null)
  const credits = useAiCredits(client)
  const upsell = useAiCreditsUpsell()

  useEffect(() => () => controllerRef.current?.abort(), [])

  const generate = useCallback(async () => {
    const description = request.trim()
    if (!description) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus({type: 'generating', attempt: 1})
    // The types of the result's documents, besides the ones the description names
    const types = new Set(documentsInResult(result).flatMap((document) => document.type ?? []))
    try {
      const generated = await generateMutations({
        request: description,
        result,
        schema: schema ? summarizeSchema(schema, [description, ...types].join(' ')) : '',
        client,
        mutationOptions,
        signal: controller.signal,
        onAttempt: (attempt) => setStatus({type: 'generating', attempt}),
      })
      if (controller.signal.aborted) return
      reportAiCreditsGranted(client)
      onGenerated(toText(generated.mutations), {
        key: mutationRunKey(dataset, generated.mutations, mutationOptions),
        result: generated.preview,
      })
    } catch (error) {
      if (controller.signal.aborted) return
      const limit = readAiCreditsLimit(error)
      if (limit) {
        reportAiCreditsLimit(client, limit)
        upsell?.requestTurnedDown(limit)
      }
      setStatus({
        type: 'failed',
        message: error instanceof Error ? error.message : String(error),
        lastAttempt: error instanceof GenerateMutationsError ? error.lastAttempt : undefined,
        limit,
      })
    }
  }, [client, dataset, mutationOptions, onGenerated, request, result, schema, upsell])

  const generating = status.type === 'generating'
  const lastAttempt = status.type === 'failed' ? status.lastAttempt : undefined
  // The credits as the failed request reported them, or as last read while nothing is going on
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Card border data-testid="vista-mutate-generate-bar" padding={2} radius={2}>
      <Stack gap={2}>
        <PromptRow
          label={t('vista.mutate.generate.label')}
          onChange={setRequest}
          onClose={onClose}
          onSubmit={() => void generate()}
          pending={generating}
          placeholder={t('vista.mutate.generate.placeholder')}
          testIdPrefix="vista-mutate-generate"
          value={request}
        />
        {status.type === 'idle' && !atLimit && (
          <Text muted size={0}>
            {t('vista.mutate.generate.description')}
          </Text>
        )}
        {status.type === 'generating' && (
          <Text data-testid="vista-mutate-generate-progress" muted size={1}>
            {status.attempt > 1
              ? t('vista.mutate.generate.progress-retry', {
                  attempt: status.attempt,
                  max: MAX_GENERATE_ATTEMPTS,
                })
              : t('vista.mutate.generate.progress')}
          </Text>
        )}
        {status.type === 'failed' && !atLimit && (
          <Card data-testid="vista-mutate-generate-error" padding={3} radius={2} tone="critical">
            <Stack gap={3}>
              <Text size={1} weight="medium">
                {t('vista.mutate.generate.failed')}
              </Text>
              <Text size={1}>{status.message}</Text>
              {lastAttempt && (
                <Flex>
                  <Button
                    data-testid="vista-mutate-generate-open-anyway"
                    fontSize={1}
                    mode="ghost"
                    onClick={() => onOpenAttempt(toText(lastAttempt))}
                    padding={2}
                    text={t('vista.generate.open-anyway')}
                  />
                </Flex>
              )}
            </Stack>
          </Card>
        )}
        <AiCreditsStatus apiHost={client.config().apiHost} credits={shownCredits} size={0} />
      </Stack>
    </Card>
  )
}
