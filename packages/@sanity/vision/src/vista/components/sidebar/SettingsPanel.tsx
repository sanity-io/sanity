import {RestoreIcon} from '@sanity/icons/Restore'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Stack, Switch, Text, TextArea} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {dequal} from 'dequal/lite'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {validateApiVersion} from '../../../util/validateApiVersion'
import {
  useSavedQueriesApi,
  useVistaActor,
  useVistaExperience,
  useVistaSelector,
} from '../../store/VistaActorContext'
import {selectDatasets, selectWorkspaceDataset} from '../../store/vistaMachine'
import {DEFAULT_HIDDEN_DIFF_FIELDS} from '../../store/vistaStorage'
import {
  ApiVersionField,
  DatasetField,
  PerspectiveSelect,
  UseCdnField,
  VariantSelect,
} from '../request/OptionFields'

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
  const actorRef = useVistaActor()
  const hiddenFields = useVistaSelector((snapshot) => snapshot.context.historyDiff.hiddenFields)
  // The text as typed, for as long as it lists the stored fields: a new line being started or a
  // path being typed would otherwise be tidied away under the caret
  const [draft, setDraft] = useState<{text: string; fields: string[]}>()
  const text = draft && dequal(draft.fields, hiddenFields) ? draft.text : hiddenFields.join('\n')
  const update = (fields: string[]) =>
    actorRef.send({type: 'historyDiff.update', settings: {hiddenFields: fields}})

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text as="label" htmlFor="vista-settings-hidden-diff-fields" size={1} weight="medium">
          {t('vista.settings.history-diff.title')}
        </Text>
        <Text muted size={1}>
          {t('vista.settings.history-diff.description')}
        </Text>
      </Stack>
      <TextArea
        data-testid="vista-settings-hidden-diff-fields"
        fontSize={1}
        id="vista-settings-hidden-diff-fields"
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
          data-testid="vista-settings-hidden-diff-fields-reset"
          disabled={dequal(hiddenFields, DEFAULT_HIDDEN_DIFF_FIELDS)}
          fontSize={1}
          icon={RestoreIcon}
          mode="ghost"
          onClick={() => update([...DEFAULT_HIDDEN_DIFF_FIELDS])}
          padding={2}
          text={t('vista.settings.history-diff.reset')}
        />
      </Flex>
    </Stack>
  )
}

/** The settings, in the sidebar's drawer */
export function SettingsPanel() {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVistaActor()
  const {switchToClassic} = useVistaExperience()
  const {clearQueries} = useSavedQueriesApi()
  const datasets = useVistaSelector(selectDatasets)
  const workspaceDataset = useVistaSelector(selectWorkspaceDataset)
  const settings = useVistaSelector((snapshot) => snapshot.context.settings)
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
        title: t('vista.settings.clear-storage.error'),
        description: err instanceof Error ? err.message : String(err),
      })
      return
    }
    actorRef.send({type: 'storage.clear'})
    toast.push({
      closable: true,
      status: 'success',
      title: t('vista.settings.clear-storage.success'),
    })
    // Clearing storage also ends the redesigned experience, which unmounts this panel
    switchToClassic()
  }, [actorRef, clearQueries, switchToClassic, t, toast])

  return (
    <Box data-testid="vista-settings" padding={4}>
      <Stack gap={5}>
        <Text muted size={1}>
          {t('vista.settings.description')}
        </Text>

        <DatasetField
          dataset={settings.dataset}
          datasets={datasets}
          id="vista-settings-dataset"
          mode={settings.datasetMode}
          onChange={(dataset) => actorRef.send({type: 'settings.update', settings: dataset})}
          workspaceDataset={workspaceDataset}
        />

        <ApiVersionField
          id="vista-settings-api-version"
          locked={false}
          onChange={handleApiVersionChange}
          value={apiVersionDraft}
        />

        <PerspectiveSelect
          id="vista-settings-perspective"
          onChange={(perspective) =>
            actorRef.send({type: 'settings.update', settings: {perspective}})
          }
          value={settings.perspective}
        />

        <VariantSelect
          id="vista-settings-variant"
          onChange={(variant) => actorRef.send({type: 'settings.update', settings: {variant}})}
          value={settings.variant}
        />

        <Flex alignItems="center" as="label" gap={3}>
          <Switch
            checked={settings.includeSourceMap}
            onChange={(event) =>
              actorRef.send({
                type: 'settings.update',
                settings: {includeSourceMap: event.currentTarget.checked},
              })
            }
          />
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {t('vista.options.include-source-map')}
            </Text>
            <Text muted size={1}>
              {t('vista.options.include-source-map.description')}
            </Text>
          </Stack>
        </Flex>

        <UseCdnField
          checked={settings.useCdn}
          onChange={(useCdn) => actorRef.send({type: 'settings.update', settings: {useCdn}})}
          testId="vista-settings-use-cdn"
        />

        <Card border padding={3} radius={2}>
          <HiddenDiffFieldsSetting />
        </Card>

        <Card border padding={3} radius={2}>
          <Stack gap={3}>
            <Text size={1} weight="medium">
              {t('vista.redesign.settings.title')}
            </Text>
            <Text muted size={1}>
              {t('vista.redesign.settings.description')}
            </Text>
            <Flex>
              <Button
                data-testid="vista-settings-classic"
                icon={RestoreIcon}
                mode="ghost"
                onClick={switchToClassic}
                text={t('vista.redesign.switch-to-classic')}
              />
            </Flex>
          </Stack>
        </Card>

        <Card border padding={3} radius={2} tone={confirmClear ? 'critical' : 'default'}>
          <Stack gap={3}>
            <Text muted size={1}>
              {t('vista.settings.clear-storage.description')}
            </Text>
            <Flex gap={2}>
              {confirmClear ? (
                <>
                  <Button
                    data-testid="vista-clear-storage-confirm"
                    icon={TrashIcon}
                    onClick={() => void handleClearStorage()}
                    text={t('vista.settings.clear-storage.confirm')}
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
                  data-testid="vista-clear-storage"
                  icon={TrashIcon}
                  mode="ghost"
                  onClick={() => setConfirmClear(true)}
                  text={t('vista.settings.clear-storage')}
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
