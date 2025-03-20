import {EditIcon, PublishIcon} from '@sanity/icons'
import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'

import {Button} from '../button/Button'

export default function ButtonStory() {
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            <code>Button</code> components are limited to ensure consistency. Padding and font sizes
            are fixed, and tooltips are enforced on icon-only buttons.
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Usage examples
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              <Text muted size={1}>
                Default button
              </Text>
              <Box>
                <Button text={text} />
              </Box>
            </Stack>

            <Stack space={3}>
              <Text muted size={1}>
                Loading button with custom <code>mode</code>
              </Text>
              <Box>
                <Button loading mode="ghost" text={text} />
              </Box>
            </Stack>

            <Stack space={2}>
              <Text muted size={1}>
                Default button with icon
              </Text>
              <Box>
                <Button icon={EditIcon} text={text} />
              </Box>
            </Stack>

            <Stack space={2}>
              <Text muted size={1}>
                Icon only button with tooltip (enforced)
              </Text>
              <Box>
                <Button icon={EditIcon} tooltipProps={{content: 'Example tooltip'}} />
              </Box>
            </Stack>

            <Stack space={2}>
              <Text muted size={1}>
                Large buttons should be sparingly used
              </Text>
              <Box>
                <Button icon={PublishIcon} size="large" text="Publish" />
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
