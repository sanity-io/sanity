import {RestoreIcon} from '@sanity/icons/Restore'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Stack, TextArea} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {dequal} from 'dequal/lite'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {validateApiVersion} from '../../../util/validateApiVersion'
import {AI_FEATURE_KEYS, type AiFeature, useConfiguredAiFeatures} from '../../aiFeatures'
import {
  useSavedQueriesApi,
  useVisionActor,
  useVisionExperience,
  useVisionSelector,
} from '../../store/VisionActorContext'
import {selectDatasets, selectWorkspaceDataset} from '../../store/visionMachine'
import {DEFAULT_HIDDEN_DIFF_FIELDS} from '../../store/visionStorage'
import {DatasetField} from '../request/DatasetField'
import {
  ApiVersionField,
  PerspectiveSelect,
  UseCdnField,
  VariantSelect,
} from '../request/OptionFields'
import {SwitchField} from '../SwitchField'
import {ExportSnippetsSettings} from './ExportSnippetsSettings'

/** One field path per line (commas work too), each once */
function parseFieldList(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,]/)
        .map((field) => field.trim())
        .filter(Boolean),
    ),
  ]
}

function HiddenDiffFieldsSetting() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const hiddenFields = useVisionSelector((snapshot) => snapshot.context.historyDiff.hiddenFields)
  // The text as typed, for as long as it lists the stored fields: a new line being started or a
  // path being typed would otherwise be tidied away under the caret
  const [draft, setDraft] = useState<{text: string; fields: string[]}>()
  const text = draft && dequal(draft.fields, hiddenFields) ? draft.text : hiddenFields.join('\n')
  const update = (fields: string[]) =>
    actorRef.send({type: 'historyDiff.update', settings: {hiddenFields: fields}})

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text
          as="label"
          htmlFor="vision-settings-hidden-diff-fields"
          size={1}
          weight="medium"
          trim={true}
        >
          {t('vision.settings.history-diff.title')}
        </Text>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.settings.history-diff.description')}
        </Text>
      </Stack>
      <TextArea
        data-testid="vision-settings-hidden-diff-fields"
        fontSize={1}
        id="vision-settings-hidden-diff-fields"
        onChange={(event) => {
          const next = event.currentTarget.value
          const fields = parseFieldList(next)
          setDraft({text: next, fields})
          update(fields)
        }}
        rows={4}
        value={text}
      />
      <Flex>
        <Button
          data-testid="vision-settings-hidden-diff-fields-reset"
          disabled={dequal(hiddenFields, DEFAULT_HIDDEN_DIFF_FIELDS)}
          fontSize={1}
          icon={RestoreIcon}
          mode="ghost"
          onClick={() => update([...DEFAULT_HIDDEN_DIFF_FIELDS])}
          padding={2}
          text={t('vision.settings.history-diff.reset')}
        />
      </Flex>
    </Stack>
  )
}

const AI_FEATURE_TEXT = {
  generateQuery: {
    title: 'vision.settings.ai.generate-query',
    description: 'vision.settings.ai.generate-query.description',
  },
  editQuery: {
    title: 'vision.settings.ai.edit-query',
    description: 'vision.settings.ai.edit-query.description',
  },
  fixLint: {
    title: 'vision.settings.ai.fix-lint',
    description: 'vision.settings.ai.fix-lint.description',
  },
  generateMutations: {
    title: 'vision.settings.ai.generate-mutations',
    description: 'vision.settings.ai.generate-mutations.description',
  },
  explainQuery: {
    title: 'vision.settings.ai.explain-query',
    description: 'vision.settings.ai.explain-query.description',
  },
} as const satisfies Record<AiFeature, {title: string; description: string}>

/**
 * Switches for the AI features the config leaves on; none at all when it leaves none on. They
 * only switch features off, so a feature the config turns off has no switch.
 */
function AiSettings() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const configured = useConfiguredAiFeatures()
  const settings = useVisionSelector((snapshot) => snapshot.context.ai)
  const features = AI_FEATURE_KEYS.filter((feature) => configured[feature])
  if (features.length === 0) return null

  return (
    <Card border data-testid="vision-settings-ai" padding={3} radius={2}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {t('vision.settings.ai.title')}
          </Text>
          <Text muted size={1} as="div" trim={true}>
            {t('vision.settings.ai.description')}
          </Text>
        </Stack>
        <SwitchField
          checked={settings.enabled}
          onChange={(enabled) => actorRef.send({type: 'ai.update', settings: {enabled}})}
          testId="vision-settings-ai-enabled"
          title={t('vision.settings.ai.enabled')}
        />
        {features.map((feature) => (
          <SwitchField
            checked={settings.enabled && settings[feature]}
            description={t(AI_FEATURE_TEXT[feature].description)}
            disabled={!settings.enabled}
            key={feature}
            onChange={(checked) =>
              actorRef.send({type: 'ai.update', settings: {[feature]: checked}})
            }
            testId={`vision-settings-ai-${feature}`}
            title={t(AI_FEATURE_TEXT[feature].title)}
          />
        ))}
      </Stack>
    </Card>
  )
}

/** The settings, in the sidebar's drawer */
export function SettingsPanel() {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const {switchToClassic} = useVisionExperience()
  const {clearQueries} = useSavedQueriesApi()
  const datasets = useVisionSelector(selectDatasets)
  const workspaceDataset = useVisionSelector(selectWorkspaceDataset)
  const settings = useVisionSelector((snapshot) => snapshot.context.settings)
  const editorSettings = useVisionSelector((snapshot) => snapshot.context.editor)
  const responseSettings = useVisionSelector((snapshot) => snapshot.context.response)
  const [confirmClear, setConfirmClear] = useState(false)
  // The "Other" input may hold an unfinished version; only usable ones become the default
  const [apiVersionDraft, setApiVersionDraft] = useState(settings.apiVersion)

  const handleApiVersionChange = useCallback(
    (apiVersion: string) => {
      setApiVersionDraft(apiVersion)
      if (validateApiVersion(apiVersion)) {
        actorRef.send({type: 'settings.update', settings: {apiVersion}})
      }
    },
    [actorRef],
  )

  const handleClearStorage = useCallback(async () => {
    setConfirmClear(false)
    // The saved queries live on the server; nothing local is dropped until they are gone
    try {
      await clearQueries()
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('vision.settings.clear-storage.error'),
        description: err instanceof Error ? err.message : String(err),
      })
      return
    }
    actorRef.send({type: 'storage.clear'})
    toast.push({
      closable: true,
      status: 'success',
      title: t('vision.settings.clear-storage.success'),
    })
    // Clearing storage also ends the redesigned experience, which unmounts this panel
    switchToClassic()
  }, [actorRef, clearQueries, switchToClassic, t, toast])

  return (
    <Box data-testid="vision-settings" padding={4}>
      <Stack gap={5}>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.settings.description')}
        </Text>

        <DatasetField
          dataset={settings.dataset}
          datasets={datasets}
          id="vision-settings-dataset"
          mode={settings.datasetMode}
          onChange={(dataset) => actorRef.send({type: 'settings.update', settings: dataset})}
          workspaceDataset={workspaceDataset}
        />

        <ApiVersionField
          id="vision-settings-api-version"
          locked={false}
          onChange={handleApiVersionChange}
          value={apiVersionDraft}
        />

        <PerspectiveSelect
          id="vision-settings-perspective"
          onChange={(perspective) =>
            actorRef.send({type: 'settings.update', settings: {perspective}})
          }
          value={settings.perspective}
        />

        <VariantSelect
          id="vision-settings-variant"
          onChange={(variant) => actorRef.send({type: 'settings.update', settings: {variant}})}
          value={settings.variant}
        />

        <SwitchField
          checked={settings.includeSourceMap}
          description={t('vision.options.include-source-map.description')}
          onChange={(includeSourceMap) =>
            actorRef.send({type: 'settings.update', settings: {includeSourceMap}})
          }
          title={t('vision.options.include-source-map')}
        />

        <UseCdnField
          checked={settings.useCdn}
          onChange={(useCdn) => actorRef.send({type: 'settings.update', settings: {useCdn}})}
          testId="vision-settings-use-cdn"
        />

        <Card border padding={3} radius={2}>
          <Stack gap={4}>
            <Text size={1} weight="medium" as="div" trim={true}>
              {t('vision.settings.editor.title')}
            </Text>
            <SwitchField
              checked={editorSettings.autoFormatOnResize}
              description={t('vision.settings.editor.auto-format-on-resize.description')}
              onChange={(autoFormatOnResize) =>
                actorRef.send({type: 'editor.update', settings: {autoFormatOnResize}})
              }
              testId="vision-settings-auto-format-on-resize"
              title={t('vision.settings.editor.auto-format-on-resize')}
            />
          </Stack>
        </Card>

        <Card border padding={3} radius={2}>
          <Stack gap={4}>
            <Text size={1} weight="medium" as="div" trim={true}>
              {t('vision.settings.response.title')}
            </Text>
            <SwitchField
              checked={responseSettings.resolveSyncTags}
              description={t('vision.settings.response.resolve-sync-tags.description')}
              onChange={(resolveSyncTags) =>
                actorRef.send({type: 'response.update', settings: {resolveSyncTags}})
              }
              testId="vision-settings-resolve-sync-tags"
              title={t('vision.settings.response.resolve-sync-tags')}
            />
          </Stack>
        </Card>

        <Card border padding={3} radius={2}>
          <HiddenDiffFieldsSetting />
        </Card>

        <ExportSnippetsSettings />

        <AiSettings />

        <Card border padding={3} radius={2}>
          <Stack gap={3}>
            <Text size={1} weight="medium" as="div" trim={true}>
              {t('vision.redesign.settings.title')}
            </Text>
            <Text muted size={1} as="div" trim={true}>
              {t('vision.redesign.settings.description')}
            </Text>
            <Flex>
              <Button
                data-testid="vision-settings-classic"
                icon={RestoreIcon}
                mode="ghost"
                onClick={switchToClassic}
                text={t('vision.redesign.switch-to-classic')}
              />
            </Flex>
          </Stack>
        </Card>

        <Card border padding={3} radius={2} tone={confirmClear ? 'critical' : 'default'}>
          <Stack gap={3}>
            <Text muted size={1} as="div" trim={true} tone={confirmClear ? 'critical' : undefined}>
              {t('vision.settings.clear-storage.description')}
            </Text>
            <Flex gap={2}>
              {confirmClear ? (
                <>
                  <Button
                    data-testid="vision-clear-storage-confirm"
                    icon={TrashIcon}
                    onClick={() => void handleClearStorage()}
                    text={t('vision.settings.clear-storage.confirm')}
                    tone="critical"
                  />
                  <Button
                    mode="bleed"
                    onClick={() => setConfirmClear(false)}
                    text={t('action.query-cancel')}
                  />
                </>
              ) : (
                <Button
                  data-testid="vision-clear-storage"
                  icon={TrashIcon}
                  mode="ghost"
                  onClick={() => setConfirmClear(true)}
                  text={t('vision.settings.clear-storage')}
                  tone="critical"
                />
              )}
            </Flex>
          </Stack>
        </Card>
      </Stack>
    </Box>
  )
}
