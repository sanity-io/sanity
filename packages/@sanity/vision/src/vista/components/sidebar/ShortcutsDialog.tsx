import {Dialog, Hotkeys, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVistaActor} from '../../store/VistaActorContext'
import {EDITOR_SHORTCUTS, VISTA_SHORTCUT_LIST} from '../../util/shortcuts'

export function ShortcutsDialog() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
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
          {[...VISTA_SHORTCUT_LIST, ...EDITOR_SHORTCUTS].map((shortcut) => (
            <Flex
              alignItems="center"
              gap={3}
              justifyContent="space-between"
              key={shortcut.labelKey}
            >
              <Text size={1}>{t(shortcut.labelKey)}</Text>
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
