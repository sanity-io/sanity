import {Dialog, Hotkeys, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVistaActor} from '../../store/VistaActorContext'
import {getVistaShortcuts, type VistaShortcutId} from '../../util/shortcuts'

const LABEL_KEYS: Record<
  VistaShortcutId,
  'vista.shortcuts.fetch' | 'vista.shortcuts.prettify' | 'vista.shortcuts.copy-query'
> = {
  'fetch': 'vista.shortcuts.fetch',
  'prettify': 'vista.shortcuts.prettify',
  'copy-query': 'vista.shortcuts.copy-query',
}

export function ShortcutsDialog() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const shortcuts = useMemo(() => getVistaShortcuts(), [])
  const close = () => actorRef.send({type: 'dialog.close'})

  return (
    <Dialog
      data-testid="vista-shortcuts-dialog"
      header={t('vista.shortcuts.title')}
      id="vista-shortcuts-dialog"
      onClickOutside={close}
      onClose={close}
      width={0}
    >
      <Box padding={4}>
        <Stack gap={4}>
          {shortcuts.map((shortcut) => (
            <Flex alignItems="center" gap={3} justifyContent="space-between" key={shortcut.id}>
              <Text size={1}>{t(LABEL_KEYS[shortcut.id])}</Text>
              <Hotkeys fontSize={1} keys={shortcut.keys} />
            </Flex>
          ))}
          <Flex alignItems="center" gap={3} justifyContent="space-between">
            <Text size={1}>{t('vista.shortcuts.close')}</Text>
            <Hotkeys fontSize={1} keys={['Esc']} />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
