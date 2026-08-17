import {AddIcon} from '@sanity/icons/Add'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {type ButtonTone, Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'

import {MenuItem} from '../../menuItem/MenuItem'
import {MenuGroup} from '../MenuGroup'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const GROUP_POPOVER = {placement: 'right' as const}

/**
 * Chromatic sentinel for the studio MenuGroup wrapper (fixed padding/font,
 * closed rows only). Shared with Storybook via a thin CSF wrapper.
 */
export function MenuGroupStory() {
  return (
    <Card padding={4}>
      <Card padding={1} radius={2} shadow={2} style={{maxWidth: 280}}>
        <Menu>
          {TONES.map((tone) => (
            <MenuGroup key={tone} icon={AddIcon} popover={GROUP_POPOVER} text={tone} tone={tone}>
              <MenuItem icon={PublishIcon} text="Child" />
            </MenuGroup>
          ))}
          <MenuGroup
            disabled
            icon={TrashIcon}
            popover={GROUP_POPOVER}
            text="Disabled"
            tone="critical"
          >
            <MenuItem icon={TrashIcon} text="Child" />
          </MenuGroup>
        </Menu>
      </Card>
      <Text muted size={1} style={{marginTop: 16}}>
        closed groups — tones and disabled
      </Text>
    </Card>
  )
}
