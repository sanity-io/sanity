import {RestoreIcon} from '@sanity/icons/Restore'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Dialog, Stack, Switch, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
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
import {
  ApiVersionField,
  DatasetField,
  PerspectiveSelect,
  VariantSelect,
} from '../request/OptionFields'

export function SettingsDialog() {
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

  const close = useCallback(() => actorRef.send({type: 'dialog.close'}), [actorRef])

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
    // Clearing storage also ends the redesigned experience, which unmounts this dialog
    switchToClassic()
  }, [actorRef, clearQueries, switchToClassic, t, toast])

  return (
    <Dialog
      data-testid="vista-settings-dialog"
      header={t('vista.settings.title')}
      id="vista-settings-dialog"
      onClickOutside={close}
      onClose={close}
      width={0}
    >
      <Box padding={4}>
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
    </Dialog>
  )
}
