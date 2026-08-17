import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Badge, Card, Flex, Text} from '@sanity/ui'
import {type ThemeColorStateToneKey} from '@sanity/ui/theme'

import {ToneIcon} from '../ToneIcon'

const TONES: ThemeColorStateToneKey[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Studio ToneIcon sentinel: icon color via `--card-badge-*-icon-color`.
 */
export function ToneIconStory() {
  return (
    <Card padding={4}>
      <Flex gap={4}>
        {TONES.map((tone) => (
          <Flex key={tone} align="center" direction="column" gap={2}>
            <Badge tone={tone === 'default' ? undefined : tone}>
              <Text size={1}>
                <ToneIcon icon={InfoOutlineIcon} tone={tone} />
              </Text>
            </Badge>
            <Text muted size={0}>
              {tone}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  )
}
