import {Dialog, Hotkeys, Stack} from '@sanity/ui'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVisionActor} from '../../store/VisionActorContext'
import {
  EDITOR_SHORTCUTS,
  VISION_SHORTCUT_LIST,
  VISION_TAB_SHORTCUT_LIST,
} from '../../util/shortcuts'
import * as themeStyles from '../themeTokens.module.css'

const VSCODE_TAB_KEYS = VISION_TAB_SHORTCUT_LIST.map(({vscodeKeys}) => vscodeKeys.join('+')).join(
  ', ',
)

function ShortcutRow({keys, label}: {keys: string[]; label: string}) {
  return (
    <Flex alignItems="center" gap={3} justifyContent="space-between">
      <Text size={1} as="div" trim={true}>
        {label}
      </Text>
      <Hotkeys fontSize={1} keys={keys} />
    </Flex>
  )
}

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
      <Box className={themeStyles.themeTokens} padding={4}>
        <Stack gap={4}>
          {[...VISION_SHORTCUT_LIST, ...VISION_TAB_SHORTCUT_LIST].map((shortcut) => (
            <ShortcutRow
              key={shortcut.labelKey}
              keys={shortcut.keys}
              label={t(shortcut.labelKey)}
            />
          ))}
          <Text muted size={1} as="div">
            {t('vision.shortcuts.tabs-app-window', {keys: VSCODE_TAB_KEYS})}
          </Text>
          {EDITOR_SHORTCUTS.map((shortcut) => (
            <ShortcutRow
              key={shortcut.labelKey}
              keys={shortcut.keys}
              label={t(shortcut.labelKey)}
            />
          ))}
          <ShortcutRow keys={['Esc']} label={t('vision.shortcuts.close')} />
        </Stack>
      </Box>
    </Dialog>
  )
}
