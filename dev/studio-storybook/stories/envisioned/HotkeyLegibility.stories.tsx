import {Button as UIButton, Card, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {styled} from 'styled-components'

// Real component from its real path (org contract §8): the keycap renderer under
// examination. The stories scale its *container* font-size, which is exactly how the
// shipped tooltip shrinks it in situ.
import {Hotkeys} from '../../../../packages/sanity/src/core/components/Hotkeys'

/**
 * The ramp the proof device walks. 13px is the Studio body size; the floor we argue
 * for is 11px (the smallest size in the type scale that keeps modifier glyphs like
 * ⌘ and ⌥ distinct); the sizes below it are what keycaps actually render at today
 * once a `fontSize={0}` tooltip label compounds with the keycap's own relative
 * sizing.
 */
const RAMP_PX = [13, 12, 11, 10, 9, 8]
const FLOOR_PX = 11

/**
 * The `<kbd>` elements inside \@sanity/ui's Hotkeys size themselves from theme
 * tokens and ignore the surrounding font-size — which is itself a finding worth
 * noting (a keycap cannot be shrunk *or* protected from shrinking via context).
 * The ramp therefore sizes the keycaps directly.
 */
const KeycapScale = styled.div<{$px: number}>`
  kbd {
    font-size: ${({$px}) => $px}px !important;
  }
`

function KeycapsAt({px, keys}: {px: number; keys: string[]}) {
  return (
    <KeycapScale $px={px}>
      <Hotkeys keys={keys} makePlatformAware={false} />
    </KeycapScale>
  )
}

const meta: Meta = {
  title: 'Envisioned/Hotkey Legibility',
  parameters: {
    docs: {
      description: {
        component: [
          'A hotkey chip is the one piece of text whose entire job is to be absorbed ' +
            'peripherally, glanced at inside a tooltip while the eye is on the control, yet today ' +
            'it is set smaller than body copy at the exact moment tooltip typography compounds ' +
            'against it.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Actions & Commands/Hotkeys` (the keycap renderer and its common-shortcuts gallery) and `Overlays & Navigation/Tooltip`, the host surface where keycaps do most of their living, at their smallest |',
          '| Evidence | design law 8 (typography has a floor); audit `minimalistic` and `keyboard-only`, a keyboard map no one can read at arm’s length is a keyboard map that doesn’t teach |',
          '| Patterns | `keyboard-only` · `minimalistic` |',
          '',
          'Tooltip typography compounds (a small label, a keycap sized relative to that), and the ' +
            'glyphs that matter most, the command and option symbols, the difference between K ' +
            'and X, are precisely the ones that die first under 11px. Keycaps deserve a floor: a ' +
            'minimum rendered size that tooltips must respect no matter what their label text ' +
            'does, the same way the Dialog measure work capped prose instead of hoping authors ' +
            'would.',
          '',
          '> **Why it matters:** the size ramp walks the real `Hotkeys` component down from body ' +
            'size with the floor drawn as a line in the track. Step back a metre and read it ' +
            'again, wherever your reading stops is the argument, self-administered.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:actions',
    'chapter:style',
    'pattern:keyboard-only',
    'pattern:minimalistic',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

/**
 * The ramp: the real keycap component at six sizes, floor marked. The glyphs to
 * watch are the command/option pair (they merge into smudges first) and the K/X
 * pair. Read it at normal distance, then from a metre back, the floor is wherever
 * your reading stopped, and the line sits at 11px because that is where the
 * modifier glyphs stop surviving for most viewers.
 */
export const SizeRamp: Story = {
  name: 'Proof: the size ramp',
  render: () => (
    <Stack gap={3} style={{maxWidth: 460}}>
      {RAMP_PX.map((px) => (
        <Card
          key={px}
          padding={3}
          radius={2}
          border
          tone={px < FLOOR_PX ? 'critical' : px === FLOOR_PX ? 'positive' : 'transparent'}
        >
          <Flex align="center" gap={4}>
            <Text size={0} muted style={{width: 88}}>
              {px}px{px === FLOOR_PX ? ', floor' : px < FLOOR_PX ? ', below' : ''}
            </Text>
            <KeycapsAt px={px} keys={['Ctrl', 'Alt', 'K']} />
            <KeycapsAt px={px} keys={['Ctrl', 'Shift', 'X']} />
          </Flex>
        </Card>
      ))}
      <Text size={0} muted>
        Everything below the green row is where the shipped tooltip stack can land once sizes
        compound. Below the floor, a keycap is decoration wearing information’s clothes.
      </Text>
    </Stack>
  ),
}

/**
 * The twins, live: hover each button and compare the shortcut you take away. Both
 * tooltips are the real `@sanity/ui` Tooltip with the real `Hotkeys` inside; the only
 * difference is that the right one refuses to render its keycaps below the 11px
 * floor. The floor is a constraint on the *container*, not a bigger design, nothing
 * else in the tooltip changes.
 */
export const TooltipTwins: Story = {
  name: 'Proof: tooltip twins (hover both)',
  render: () => {
    function Demo() {
      const [runs, setRuns] = useState(0)
      return (
        <Stack gap={4} style={{maxWidth: 520}}>
          <Flex gap={4} wrap="wrap">
            <Stack gap={2}>
              <Text size={0} muted>
                As compounding shrinks it (8px)
              </Text>
              <Tooltip
                content={
                  <Flex align="center" gap={2} padding={1}>
                    <Text size={0}>Publish</Text>
                    <KeycapsAt px={8} keys={['Ctrl', 'Alt', 'P']} />
                  </Flex>
                }
                portal
              >
                <UIButton text="Publish" tone="primary" onClick={() => setRuns((n) => n + 1)} />
              </Tooltip>
            </Stack>
            <Stack gap={2}>
              <Text size={0} muted>
                Holding the floor (11px)
              </Text>
              <Tooltip
                content={
                  <Flex align="center" gap={2} padding={1}>
                    <Text size={0}>Publish</Text>
                    <KeycapsAt px={FLOOR_PX} keys={['Ctrl', 'Alt', 'P']} />
                  </Flex>
                }
                portal
              >
                <UIButton text="Publish" tone="primary" onClick={() => setRuns((n) => n + 1)} />
              </Tooltip>
            </Stack>
          </Flex>
          <Text size={0} muted>
            The tooltip is a shortcut’s only classroom, an editor who can’t read it there pays the
            pointer path forever. (Buttons pressed: {runs}, imagine each one was a keystroke you
            never learned.)
          </Text>
        </Stack>
      )
    }
    return <Demo />
  },
}
