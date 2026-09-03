import {SpinnerIcon} from '@sanity/icons/Spinner'
import {Badge, Box, Card, Checkbox, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {type AlignItems, Flex} from 'ui5'

import {Button} from '../button/Button'

const ALIGN_ITEMS: AlignItems[] = ['flex-start', 'center', 'flex-end', 'baseline', 'stretch']

function Section(props: {label: string; children: ReactNode}) {
  const {label, children} = props
  return (
    <Stack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      {children}
    </Stack>
  )
}

/**
 * Layout sentinel for the `ui5` Flex primitive, mirroring the prop mappings
 * the dev-studio Flex migration relies on (embedded-studio, preview-iframe,
 * radar, studio-diagnostics-viewer, the e2e studio layouts and test-studio):
 * `flexDirection`/`alignItems`/`justifyContent`/`flexWrap` for the v4
 * `direction`/`align`/`justify`/`wrap` props, `height="100%"` for
 * `height="fill"`, and `flexBasis="0%" flexGrow={1}` / `flexShrink={0}` for
 * `flex={1}` / inline flex styles. Those apps live outside the Storybook
 * glob and render live data, so the primitive is snapshotted here together
 * with the `@sanity/ui` v4 children they mix in (Card, Badge, Checkbox and a
 * v4 `Box flex={1}`). Fixture copy only; no spinner animation.
 */
const meta = {
  title: 'Sanity UI/Flex Layouts',
  component: Flex,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof Flex>

export default meta
type Story = StoryObj<typeof meta>

export const Layouts: Story = {
  render: () => (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={5}>
        <Section label="column shell: flexDirection=column height=100% overflow=hidden, body flexBasis=0% flexGrow=1">
          <Card border radius={2} style={{height: 160}}>
            <Flex flexDirection="column" height="100%" overflow="hidden">
              <Card borderBottom>
                <Flex gap={1} padding={2}>
                  <Button mode="ghost" text="Layout" />
                  <Button mode="ghost" text="Studio" />
                </Flex>
              </Card>
              <Flex flexDirection="column" flexBasis="0%" flexGrow={1}>
                <Card height="fill" padding={3} tone="primary">
                  <Text size={1}>Body fills the remaining height</Text>
                </Card>
              </Flex>
            </Flex>
          </Card>
        </Section>

        <Section label="centered loading state: alignItems=center justifyContent=center height=100%">
          <Card border radius={2} style={{height: 120}}>
            <Flex
              alignItems="center"
              flexDirection="column"
              gap={3}
              height="100%"
              justifyContent="center"
            >
              <Text muted size={2}>
                <SpinnerIcon />
              </Text>
              <Text align="center" muted size={1}>
                Loading document
              </Text>
            </Flex>
          </Card>
        </Section>

        <Section label="wrapping row: alignItems=center gap=3 flexWrap=wrap with a v4 Box flex=1">
          <Card border padding={3} radius={2} style={{maxWidth: 360}}>
            <Flex alignItems="center" gap={3} flexWrap="wrap">
              <Box flex={1} style={{minWidth: 220}}>
                <Stack gap={2}>
                  <Text size={1} weight="medium">
                    Document pane render time regressed
                  </Text>
                  <Flex alignItems="center" gap={2}>
                    <Text muted size={0}>
                      2 days ago
                    </Text>
                    <Text muted size={0}>
                      · cursor[bot]
                    </Text>
                  </Flex>
                </Stack>
              </Box>
              <Badge fontSize={0} tone="critical">
                first bad commit
              </Badge>
              <Badge fontSize={0}>a1b2c3d</Badge>
              <Badge fontSize={0}>v4.12.0</Badge>
              <Button mode="ghost" text="Open" />
            </Flex>
          </Card>
        </Section>

        <Section label="space-between header: flexBasis=0% flexGrow=1 title, flexShrink=0 actions">
          <Card border padding={3} radius={2} style={{maxWidth: 320}}>
            <Flex alignItems="center" gap={3} justifyContent="space-between">
              <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap={1}>
                <Text size={1} weight="medium">
                  Largest Contentful Paint on the document pane after a cold reload
                </Text>
                <Text muted size={0}>
                  median of 5 runs
                </Text>
              </Flex>
              <Flex alignItems="center" flexShrink={0} gap={2}>
                <Badge fontSize={0} tone="positive">
                  ↓ -22%
                </Badge>
                <Button mode="bleed" text="Details" />
              </Flex>
            </Flex>
          </Card>
        </Section>

        <Section label="dialog footer: gap=2 justifyContent=flex-end">
          <Card border padding={3} radius={2}>
            <Flex gap={2} justifyContent="flex-end">
              <Button mode="ghost" text="Cancel" />
              <Button text="Start bisect" tone="primary" />
            </Flex>
          </Card>
        </Section>

        <Section label="alignItems variants against a taller sibling">
          <Stack gap={3}>
            {ALIGN_ITEMS.map((alignItems) => (
              <Flex key={alignItems} alignItems={alignItems} gap={3}>
                <Card border padding={2} radius={2} tone="transparent">
                  <Text size={0}>alignItems="{alignItems}"</Text>
                </Card>
                <Card border padding={3} radius={2} style={{height: 56}}>
                  <Text size={1}>taller sibling</Text>
                </Card>
              </Flex>
            ))}
          </Stack>
        </Section>

        <Section label="tool menu: flexDirection=row (topbar) vs column (sidebar)">
          <Flex alignItems="flex-start" gap={5}>
            <Flex flexDirection="row" gap={3}>
              <Button mode="bleed" text="Structure" />
              <Button mode="bleed" text="Vision" />
              <Button mode="bleed" text="Releases" />
            </Flex>
            <Flex flexDirection="column" gap={3}>
              <Button mode="bleed" text="Structure" />
              <Button mode="bleed" text="Vision" />
              <Button mode="bleed" text="Releases" />
            </Flex>
          </Flex>
        </Section>

        <Section label="checkbox row: as=label alignItems=center gap=2">
          <Card border padding={3} radius={2}>
            <Flex alignItems="center" as="label" gap={2}>
              <Checkbox defaultChecked />
              <Flex flexBasis="0%" flexGrow={1}>
                <Text size={1} weight="semibold">
                  All languages
                </Text>
              </Flex>
              <Text muted size={1}>
                3 of 3
              </Text>
            </Flex>
          </Card>
        </Section>
      </Stack>
    </Card>
  ),
}
