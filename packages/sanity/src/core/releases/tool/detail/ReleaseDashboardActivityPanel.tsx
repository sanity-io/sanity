import {Stack, Text} from '@sanity/ui'

export function ReleaseDashboardActivityPanel() {
  return (
    <Stack space={3} padding={3}>
      <Text size={1} weight="semibold">
        {'Activity'}
      </Text>
      <Text muted size={0}>
        {'🚧 Under construction 🚧'}
      </Text>
    </Stack>
  )
}
