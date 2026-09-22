import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Dialog, Stack, Switch, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {type KeyValueStoreValue, useKeyValueStore, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {API_VERSIONS} from '../../../apiVersions'
import {STORED_QUERIES_NAMESPACE} from '../../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../../i18n'
import {validateApiVersion} from '../../../util/validateApiVersion'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {createTabOptions} from '../../store/vistaStorage'
import {ApiVersionField, DatasetSelect, PerspectiveSelect} from '../request/OptionFields'

export function SettingsDialog({datasets}: {datasets: string[]}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVistaActor()
  const keyValueStore = useKeyValueStore()
  const settings = useVistaSelector((snapshot) => snapshot.context.settings)
  const [confirmClear, setConfirmClear] = useState(false)
  // Lets the "Other" input hold an unfinished version without it reaching the settings
  const [customApiVersion, setCustomApiVersion] = useState<string | false>(
    () => createTabOptions(settings).customApiVersion,
  )

  const close = useCallback(() => actorRef.send({type: 'dialog.close'}), [actorRef])

  const handleApiVersionChange = useCallback(
    (next: {apiVersion: string; customApiVersion: string | false}) => {
      setCustomApiVersion(next.customApiVersion)
      const effective =
        next.customApiVersion !== false && validateApiVersion(next.customApiVersion)
          ? next.customApiVersion
          : next.customApiVersion === false
            ? next.apiVersion
            : undefined
      if (effective) {
        actorRef.send({type: 'settings.update', settings: {apiVersion: effective}})
      }
    },
    [actorRef],
  )

  const handleClearStorage = useCallback(async () => {
    setConfirmClear(false)
    actorRef.send({type: 'storage.clear'})
    try {
      await keyValueStore.setKey(STORED_QUERIES_NAMESPACE, {
        queries: [],
      } as unknown as KeyValueStoreValue)
      toast.push({
        closable: true,
        status: 'success',
        title: t('vista.settings.clear-storage.success'),
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('vista.settings.clear-storage.error'),
        description: err instanceof Error ? err.message : String(err),
      })
    }
    close()
  }, [actorRef, close, keyValueStore, t, toast])

  const listedApiVersion = API_VERSIONS.includes(settings.apiVersion)
    ? settings.apiVersion
    : createTabOptions(settings).apiVersion

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

          <DatasetSelect
            datasets={datasets}
            id="vista-settings-dataset"
            onChange={(dataset) => actorRef.send({type: 'settings.update', settings: {dataset}})}
            value={settings.dataset}
          />

          <ApiVersionField
            apiVersion={listedApiVersion}
            customApiVersion={customApiVersion}
            id="vista-settings-api-version"
            locked={false}
            onChange={handleApiVersionChange}
          />

          <PerspectiveSelect
            id="vista-settings-perspective"
            onChange={(perspective) =>
              actorRef.send({type: 'settings.update', settings: {perspective}})
            }
            value={settings.perspective}
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
