import {AddIcon} from '@sanity/icons/Add'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {type ButtonTone, Card, Stack, Text} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'

import {MenuItem} from '../MenuItem'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Tone, badge, hotkeys, selected, disabled and subtitle variants of the
 * studio MenuItem wrapper. Layout here cascades through every
 * document/array/navbar menu during the ui5 migration.
 */
export function MenuItemStory() {
  return (
    <Card padding={4}>
      <Card padding={1} radius={2} shadow={2} style={{maxWidth: 320}}>
        <Menu>
          {TONES.map((tone) => (
            <MenuItem key={tone} icon={PublishIcon} text={tone} tone={tone} />
          ))}
          <MenuDivider />
          <MenuItem badgeText="New" icon={AddIcon} text="With badge" />
          <MenuItem hotkeys={['Ctrl', 'S']} icon={PublishIcon} text="With hotkeys" />
          <MenuItem icon={PublishIcon} selected text="Selected" />
          <MenuItem disabled icon={TrashIcon} text="Disabled" tone="critical" />
          <MenuItem __unstable_subtitle="Production" text="With subtitle" />
        </Menu>
      </Card>
      <Stack gap={2} marginTop={4}>
        <Text muted size={1}>
          tones, badge, hotkeys, selected, disabled, subtitle
        </Text>
      </Stack>
    </Card>
  )
}
