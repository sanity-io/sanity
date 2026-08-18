import {Badge, Card, type CardTone, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

const TONES: CardTone[] = [
  'default',
  'transparent',
  'primary',
  'positive',
  'caution',
  'critical',
  'neutral',
  'suggest',
]

/**
 * Tone sentinel for `@sanity/ui` Card. Cards propagate their tone to all
 * nested content through CSS custom properties, so regressions here cascade
 * everywhere — which is why card/tone coverage is prioritized during the ui5
 * migration.
 */
const meta = {
  title: 'Sanity UI/Card Tones',
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const AllTones: Story = {
  render: () => (
    <Grid gap={3} gridTemplateColumns={2} padding={4}>
      {TONES.map((tone) => (
        <Card key={tone} border padding={4} radius={2} tone={tone}>
          <Stack gap={3}>
            <Text weight="medium">tone="{tone}"</Text>
            <Text muted size={1}>
              Nested text inherits the card tone via CSS custom properties.
            </Text>
            <Badge>Badge</Badge>
          </Stack>
        </Card>
      ))}
    </Grid>
  ),
}
