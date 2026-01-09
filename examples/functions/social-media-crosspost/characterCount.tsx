import {useFormValue} from 'sanity'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'

import {platformConfig, type Platform} from '../schemaTypes/documents/socialPost'

export function CharacterCount(props: any) {
  const doc = useFormValue([]) as any
  const parentPath = props.path.slice(0, -1)
  const parentValue = useFormValue(parentPath) as {platform?: Platform}

  // Now we can do conditional logic
  if (!doc.platforms || doc.platforms.length === 0) {
    return null
  }

  const platformFilter = parentValue?.platform
  const platformsToDisplay = platformFilter
    ? doc.platforms.filter((p: Platform) => p === platformFilter)
    : doc.platforms

  if (platformsToDisplay.length === 0) {
    return null
  }

  return (
    <Card shadow={1} padding={3} radius={2}>
      <Stack space={3}>
        <Flex gap={3} direction="row" align="center" wrap="wrap">
          {platformsToDisplay.map((platform: Platform) => {
            const platformSetting = Array.isArray(doc.platformOverrides)
              ? doc.platformOverrides.find((setting: any) => setting.platform === platform)
              : undefined
            const text = platformSetting?.body ?? doc.body ?? ''
            const limit = platformConfig[platform].limit
            const label = platformConfig[platform].label
            const isOverLimit = text.length > limit

            return (
              <Flex key={platform} gap={2} direction="row" align="center">
                <Text size={1} weight="medium">
                  {label}
                </Text>
                <Badge tone={isOverLimit ? 'critical' : 'default'}>
                  {text.length}/{limit}
                </Badge>
                {platformSetting?.body && <Badge tone="primary">Overridden</Badge>}
              </Flex>
            )
          })}
        </Flex>
      </Stack>
    </Card>
  )
}
