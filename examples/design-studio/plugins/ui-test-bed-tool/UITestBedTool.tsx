import {legacyTones} from '@sanity/base/lib/theme/legacyTones'
import {COLOR_TINTS} from '@sanity/color'
import {ComposeIcon, EyeOpenIcon, MasterDetailIcon, PlugIcon} from '@sanity/icons'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Flex,
  Heading,
  Inline,
  Stack,
  TextInput,
  useToast,
} from '@sanity/ui'
import React from 'react'

const TONE_KEYS = ['default', 'primary', 'positive', 'caution', 'critical']

// NOTE: As of v2.3.3, these are the rendering times of each section on this screen.
// No sections (only the wrapping <Card> and heading box): 100ms
const RENDER_PALETTES = false // 250ms (- 100ms)
const RENDER_TONES = false // 240ms (- 100ms)
const RENDER_NAVBAR_EXAMPLE = false // 270ms (- 100ms)
const RENDER_TOAST_PUSH_BUTTON = false // 135 ks (- 100ms)
const RENDER_EXAMPLES = true // 675ms (- 100ms)
const UI_EXAMPLE_RENDER_BADGES = false // 1800ms (- 675ms)
const UI_EXAMPLE_RENDER_CODE = false // 5250ms (- 675ms)
const UI_EXAMPLE_RENDER_BUTTONS = true // 15500ms (- 675ms)

export function UITestBedTool() {
  const toast = useToast()

  return (
    <Card>
      <Box padding={4}>
        <Heading as="h1">UITestBedTool</Heading>
      </Box>

      {RENDER_PALETTES && (
        <details>
          <Box as="summary" paddingX={4} paddingY={2}>
            color palettes
          </Box>

          <Flex padding={4}>
            {TONE_KEYS.map((toneKey) => (
              <Box flex={1} key={toneKey}>
                <Box marginBottom={1}>
                  <Code muted size={1}>
                    state.default.{toneKey}
                  </Code>
                </Box>
                {COLOR_TINTS.map((tintKey) => (
                  <Box
                    key={tintKey}
                    style={{
                      backgroundColor: legacyTones.state.default[toneKey][tintKey],
                      height: 10,
                    }}
                  />
                ))}
              </Box>
            ))}
          </Flex>

          <Flex padding={4}>
            {TONE_KEYS.map((toneKey) => (
              <Box flex={1} key={toneKey}>
                <Box marginBottom={1}>
                  <Code muted size={1}>
                    state.navbar.{toneKey}
                  </Code>
                </Box>
                {COLOR_TINTS.map((tintKey) => (
                  <Box
                    key={tintKey}
                    style={{
                      backgroundColor: legacyTones.state.navbar[toneKey][tintKey],
                      height: 10,
                    }}
                  />
                ))}
              </Box>
            ))}
          </Flex>

          <Flex padding={4}>
            {TONE_KEYS.map((toneKey) => (
              <Box flex={1} key={toneKey}>
                <Box marginBottom={1}>
                  <Code muted size={1}>
                    button.default.{toneKey}
                  </Code>
                </Box>
                {COLOR_TINTS.map((tintKey) => (
                  <Box
                    key={tintKey}
                    style={{
                      backgroundColor: legacyTones.button.default[toneKey][tintKey],
                      height: 10,
                    }}
                  />
                ))}
              </Box>
            ))}
          </Flex>

          <Flex padding={4}>
            {TONE_KEYS.map((toneKey) => (
              <Box flex={1} key={toneKey}>
                <Box marginBottom={1}>
                  <Code muted size={1}>
                    button.navbar.{toneKey}
                  </Code>
                </Box>
                {COLOR_TINTS.map((tintKey) => (
                  <Box
                    key={tintKey}
                    style={{
                      backgroundColor: legacyTones.button.navbar[toneKey][tintKey],
                      height: 10,
                    }}
                  />
                ))}
              </Box>
            ))}
          </Flex>
        </details>
      )}

      {RENDER_TONES && (
        <details>
          <Box as="summary" paddingX={4} paddingY={2}>
            legacyTones
          </Box>

          <Card overflow="auto" padding={4} tone="transparent">
            <Code language="json">{JSON.stringify(legacyTones, null, 2)}</Code>
          </Card>
        </details>
      )}

      {RENDER_TOAST_PUSH_BUTTON && (
        <Box padding={4}>
          <Button
            onClick={() => toast.push({status: 'error', title: 'Error'})}
            text="Push error toast"
          />
        </Box>
      )}

      {RENDER_NAVBAR_EXAMPLE && (
        <Box padding={4}>
          <Card scheme="dark">
            <Flex align="center">
              <Box flex={1} padding={2}>
                <Inline space={2}>
                  <Button mode="bleed" text="Sanity.io" />
                  <Button mode="bleed" icon={ComposeIcon} />
                  <TextInput />
                  <Button icon={PlugIcon} mode="bleed" text="UI Test Bed" selected />
                  <Button icon={MasterDetailIcon} mode="bleed" text="Desk" />
                  <Button icon={EyeOpenIcon} mode="bleed" text="Vision" />
                </Inline>
              </Box>
              <Box padding={2}>
                <Avatar />
              </Box>
            </Flex>
          </Card>
        </Box>
      )}

      {RENDER_EXAMPLES && (
        <Flex>
          <Card borderTop flex={1} padding={4}>
            <ThemeExample />
          </Card>

          <Card borderTop flex={1} padding={4} scheme="dark">
            <ThemeExample />
          </Card>
        </Flex>
      )}
    </Card>
  )
}

function ThemeExample() {
  return (
    <>
      <Stack space={4}>
        <Card padding={4} radius={3} shadow={3}>
          <UIExample />
        </Card>

        <Card padding={4} radius={3} shadow={3} tone="transparent">
          <UIExample />
        </Card>

        <Card padding={4} radius={3} shadow={3} tone="primary">
          <UIExample />
        </Card>

        <Card padding={4} radius={3} shadow={3} tone="positive">
          <UIExample />
        </Card>

        <Card padding={4} radius={3} shadow={3} tone="caution">
          <UIExample />
        </Card>

        <Card padding={4} radius={3} shadow={3} tone="critical">
          <UIExample />
        </Card>
      </Stack>
    </>
  )
}

function UIExample() {
  return (
    <Stack space={4}>
      {UI_EXAMPLE_RENDER_BADGES && (
        <Stack space={2}>
          <Inline space={2}>
            <Badge>Default</Badge>
            <Badge tone="primary">Primary</Badge>
            <Badge tone="positive">Positive</Badge>
            <Badge tone="caution">Caution</Badge>
            <Badge tone="critical">Critical</Badge>
          </Inline>

          <Inline space={2}>
            <Badge mode="outline">Default</Badge>
            <Badge mode="outline" tone="primary">
              Primary
            </Badge>
            <Badge mode="outline" tone="positive">
              Positive
            </Badge>
            <Badge mode="outline" tone="caution">
              Caution
            </Badge>
            <Badge mode="outline" tone="critical">
              Critical
            </Badge>
          </Inline>
        </Stack>
      )}

      {UI_EXAMPLE_RENDER_CODE && (
        <Card padding={4} shadow={1} tone="inherit">
          <Code language="ts">{`console.log('hello, world')`}</Code>
        </Card>
      )}

      {UI_EXAMPLE_RENDER_BUTTONS && (
        <Stack space={3}>
          <Inline space={2}>
            <Button text="Label" />
            <Button text="Label" tone="primary" />
            <Button text="Label" tone="positive" />
            <Button text="Label" tone="caution" />
            <Button text="Label" tone="critical" />
          </Inline>

          <Inline space={2}>
            <Button mode="bleed" text="Label" />
            <Button mode="bleed" text="Label" tone="primary" />
            <Button mode="bleed" text="Label" tone="positive" />
            <Button mode="bleed" text="Label" tone="caution" />
            <Button mode="bleed" text="Label" tone="critical" />
          </Inline>

          <Inline space={2}>
            <Button mode="ghost" text="Label" />
            <Button mode="ghost" text="Label" tone="primary" />
            <Button mode="ghost" text="Label" tone="positive" />
            <Button mode="ghost" text="Label" tone="caution" />
            <Button mode="ghost" text="Label" tone="critical" />
          </Inline>
        </Stack>
      )}
    </Stack>
  )
}
