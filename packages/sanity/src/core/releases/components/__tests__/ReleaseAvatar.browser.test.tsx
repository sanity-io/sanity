import {Button, Card, LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {Box, Flex, Text} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {Chip} from '../Chip'
import {ReleaseAvatar, ReleaseAvatarIcon} from '../ReleaseAvatar'

const theme = buildTheme()

function ReleaseAvatarHarness() {
  return (
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <Card padding={4}>
          <Flex flexDirection="column" gap={4} alignItems="flex-start">
            {/* The releases tool link in the navbar: an icon-only v4 button. */}
            <Button
              data-testid="icon-button"
              fontSize={2}
              padding={2}
              radius="full"
              mode="bleed"
              icon={<ReleaseAvatarIcon size="small" release="drafts" fontSize={2} />}
            />
            {/* The document header version chip: a v4 button with icon and text. */}
            <Chip
              data-testid="chip"
              mode="bleed"
              tone="caution"
              icon={<ReleaseAvatarIcon release="drafts" />}
              text="Drafts"
            />
            {/* A v4 button whose icon is the padded `ReleaseAvatar` box. */}
            <Button
              data-testid="avatar-button"
              mode="bleed"
              icon={<ReleaseAvatar padding={1} release="drafts" />}
              text="Drafts"
            />
            {/* Standalone next to a ui5 text, which is how migrated call sites render it. */}
            <Flex data-testid="standalone" alignItems="center" gap={2}>
              <ReleaseAvatarIcon release="drafts" />
              <Text data-testid="standalone-text" size={1} weight="medium" as="div" trim>
                Drafts
              </Text>
            </Flex>
            {/* Standalone in a block container, where nothing else blockifies the glyph. */}
            <Box data-testid="block-host">
              <ReleaseAvatarIcon release="drafts" />
            </Box>
          </Flex>
        </Card>
      </LayerProvider>
    </ThemeProvider>
  )
}

function centerY(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.top + rect.height / 2
}

// Firefox and WebKit report the centred chip glyph half a device pixel off, which
// `toBeCloseTo(0, 0)` rejects (its tolerance is strictly under 0.5). The regression this
// guards was a full pixel or more, so half a pixel is the allowance.
function expectVerticallyCentered(glyph: Element, host: Element) {
  expect(Math.abs(centerY(glyph) - centerY(host))).toBeLessThanOrEqual(0.5)
}

function glyphIn(hostTestId: string): SVGElement {
  const host = document.querySelector(`[data-testid="${hostTestId}"]`)!
  return host.querySelector('svg')!
}

describe('ReleaseAvatarIcon', () => {
  test('is centred by the v4 Text a v4 Button wraps its icon in', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseAvatarHarness />)
    await expect.element(page.getByTestId('icon-button')).toBeVisible()

    const iconButton = document.querySelector('[data-testid="icon-button"]')!
    const chip = document.querySelector('[data-testid="chip"]')!

    expectVerticallyCentered(glyphIn('icon-button'), iconButton)
    expectVerticallyCentered(glyphIn('chip'), chip)
    expect(getComputedStyle(glyphIn('icon-button')).display).toBe('inline')

    await settleChromaticEndState()
  })

  test('keeps the padded avatar box the same size inside a v4 Text', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseAvatarHarness />)
    await expect.element(page.getByTestId('avatar-button')).toBeVisible()

    const glyph = glyphIn('avatar-button')
    const avatarBox = glyph.parentElement!
    // 21px glyph trimmed by its -6px margins, plus the padding of 1 (4px) on each side.
    expect(avatarBox.getBoundingClientRect().height).toBeCloseTo(17, 0)

    await settleChromaticEndState()
  })

  test('lays itself out as a block when no v4 Text owns the layout', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseAvatarHarness />)
    await expect.element(page.getByTestId('standalone')).toBeVisible()

    const text = document.querySelector('[data-testid="standalone-text"]')!
    expectVerticallyCentered(glyphIn('standalone'), text)

    const blockGlyph = glyphIn('block-host')
    expect(getComputedStyle(blockGlyph).display).toBe('block')
    // 21px glyph trimmed by its -6px margins: the host is exactly cap-height tall.
    expect(blockGlyph.parentElement!.getBoundingClientRect().height).toBeCloseTo(9, 0)

    await settleChromaticEndState()
  })
})
