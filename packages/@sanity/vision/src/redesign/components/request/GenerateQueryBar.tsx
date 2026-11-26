import {type SanityClient} from '@sanity/client'
import {Button, Card, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useCallback, useEffect, useState} from 'react'
import {type Schema} from 'sanity'
import {useSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'
import {useTranslation} from 'sanity/i18n'
import {Text, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {useAiFeatures} from '../../aiFeatures'
import {useAiCredits} from '../../hooks/useAiCredits'
import {useQueryAgent} from '../../hooks/useQueryAgent'
import {type VisionTab} from '../../store/types'
import {describeDocumentListFields} from '../../util/documentListFields'
import {hasDatasetEmbeddings} from '../../util/embeddings'
import {editQuery, generateQuery, MAX_GENERATE_ATTEMPTS} from '../../util/generateQuery'
import {getRequestedDocumentTypes, summarizeSchema} from '../../util/schemaSummary'
import {AiCreditsStatus} from '../AiCreditsStatus'
import * as overlays from '../overlays.module.css'
import {PromptRow} from '../PromptRow'

/** What the bar asks for: a new query, or a change to the one in the editor */
export type QueryBarMode = 'generate' | 'edit'

const MODE_TEXT = {
  generate: {
    label: 'vision.generate.label',
    placeholder: 'vision.generate.placeholder',
    description: 'vision.generate.description',
    progress: 'vision.generate.progress',
    failed: 'vision.generate.failed',
    submit: 'vision.generate.submit',
  },
  edit: {
    label: 'vision.edit.label',
    placeholder: 'vision.edit.placeholder',
    description: 'vision.edit.description',
    progress: 'vision.edit.progress',
    failed: 'vision.edit.failed',
    submit: 'vision.edit.submit',
  },
} as const satisfies Record<QueryBarMode, Record<string, string>>

export interface GenerateQueryBarProps {
  mode: QueryBarMode
  tab: VisionTab
  /** The tab's params, which an edit starts from */
  params: Record<string, unknown> | undefined
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /** Formats the generated query for the query editor, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
  onClose: () => void
}

/**
 * Writes a query from a description with Agent Actions, or changes the tab's query as described,
 * under the query's last line. The result replaces the tab's query and params, and runs.
 */
export function GenerateQueryBar(props: GenerateQueryBarProps) {
  const {mode, tab, params, client, formatForEditor, onClose} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const [request, setRequest] = useState('')
  const credits = useAiCredits(client)
  const features = useAiFeatures()
  const enabled = mode === 'edit' ? features.editQuery : features.generateQuery
  const copy = MODE_TEXT[mode]
  const {status, run, openLastAttempt} = useQueryAgent({
    tab,
    client,
    formatForEditor,
    onOpened: onClose,
  })

  // What the prompt teaches depends on whether the dataset has embeddings; reading that while the
  // request is typed keeps it off the time a generation takes
  useEffect(() => {
    if (enabled) void hasDatasetEmbeddings(client)
  }, [client, enabled])

  const telemetry = useVisionTelemetry()
  // A generated query opens with a comment naming the description; an edited one keeps whatever
  // comments the model left in it
  const generate = useCallback(() => {
    const description = request.trim()
    if (!description || !enabled) return
    telemetry.agentAction(mode === 'edit' ? 'edit-query' : 'generate-query')
    void run(
      (agent) =>
        mode === 'edit'
          ? editQuery({
              ...agent,
              request: description,
              query: tab.query,
              params: params ?? {},
              schema: schema ? summarizeSchema(schema, `${description}\n${tab.query}`) : '',
            })
          : generateQuery({
              ...agent,
              request: description,
              schema: schema ? summarizeSchema(schema, description) : '',
              listFields: schema
                ? describeDocumentListFields(schema, getRequestedDocumentTypes(schema, description))
                : undefined,
            }),
      {
        prompt: description,
        comment: mode === 'generate',
        ai: {action: mode, prompt: description},
        keepParams: mode === 'edit' && params === undefined,
      },
    )
  }, [enabled, mode, params, request, run, schema, tab.query, telemetry])

  const generating = status.type === 'running'
  const lastAttempt = status.type === 'failed' ? status.lastAttempt : undefined
  // The credits as the failed request reported them, or as last read while nothing is going on
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Card
      border
      className={overlays.promptBar}
      data-testid={`vision-${mode}-bar`}
      padding={2}
      radius={2}
    >
      <Stack gap={2}>
        <PromptRow
          label={t(copy.label)}
          onChange={setRequest}
          onClose={onClose}
          onSubmit={generate}
          pending={generating}
          placeholder={t(copy.placeholder)}
          submitText={t(copy.submit)}
          testIdPrefix={`vision-${mode}`}
          value={request}
        />
        {status.type === 'idle' && !atLimit && (
          <Text className={overlays.promptStatus} muted size={0} as="div" trim={true}>
            {t(copy.description)}
          </Text>
        )}
        {status.type === 'running' && (
          <Text
            className={overlays.promptStatus}
            data-testid={`vision-${mode}-progress`}
            muted
            size={1}
            as="div"
            trim={true}
          >
            {status.attempt > 1
              ? t('vision.generate.progress-retry', {
                  attempt: status.attempt,
                  max: MAX_GENERATE_ATTEMPTS,
                })
              : t(copy.progress)}
          </Text>
        )}
        {status.type === 'failed' && !atLimit && (
          <Card
            className={overlays.promptStatus}
            data-testid={`vision-${mode}-error`}
            padding={3}
            radius={2}
            tone="critical"
          >
            <Stack gap={3}>
              <Text size={1} weight="medium" as="div" trim={true} tone="critical">
                {t(copy.failed)}
              </Text>
              <Text size={1} as="div" trim={true} tone="critical">
                {status.message}
              </Text>
              {lastAttempt && (
                <>
                  <Code size={1}>{lastAttempt.query}</Code>
                  <Flex>
                    <Button
                      data-testid={`vision-${mode}-open-anyway`}
                      fontSize={1}
                      mode="ghost"
                      onClick={openLastAttempt}
                      padding={2}
                      text={t('vision.generate.open-anyway')}
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
