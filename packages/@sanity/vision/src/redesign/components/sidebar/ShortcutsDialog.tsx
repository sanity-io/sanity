import {Dialog, Hotkeys, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVisionActor} from '../../store/VisionActorContext'
import {EDITOR_SHORTCUTS, VISION_SHORTCUT_LIST} from '../../util/shortcuts'

export function ShortcutsDialog() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const close = () => actorRef.send({type: 'dialog.close'})

  return (
    <Dialog
      animate
      data-testid="vision-shortcuts-dialog"
      header={t('vision.shortcuts.title')}
      id="vision-shortcuts-dialog"
      onClickOutside={close}
      onClose={close}
      width={0}
    >
      <Box padding={4}>
        <Stack gap={4}>
          {[...VISION_SHORTCUT_LIST, ...EDITOR_SHORTCUTS].map((shortcut) => (
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
            <Text size={1}>{t('vision.shortcuts.close')}</Text>
            <Hotkeys fontSize={1} keys={['Esc']} />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
