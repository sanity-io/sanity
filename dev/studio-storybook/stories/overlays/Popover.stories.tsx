import {
  Box,
  Button as UIButton,
  Card,
  Flex,
  Grid,
  Popover as UIPopover,
  Stack,
  Text,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useState} from 'react'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {Popover} from '../../../../packages/sanity/src/ui-components/popover/Popover'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof Popover> = {
  title: 'Overlays & Navigation/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component: [
          'Almost every floating thing in Studio, a dropdown menu, a hover card, an inline colour ' +
            'picker, sits on this one component underneath, and the audit finding is what happens in ' +
            'the gap before its content is ready to paint.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/popover/Popover.tsx`, Studio shadow of `@sanity/ui` `Popover` |',
          '| Tier | SERVICE. Deliberately thin: the only change from the primitive is defaulting `animate` to `true`, so every Studio popover animates unless a nested popover opts out to avoid `AnimatePresence` conflicts |',
          '| Audit | 🔴 needs-work (`instant-gratification`). Popovers can flash empty for ~1s before their content paints; the related `hover-popup-tools` behaviour itself holds |',
          '| Patterns | `hover-popup-tools` · `instant-gratification` |',
          '',
          'You get the full primitive surface and consistent motion for free. Because the shadow adds ' +
            'nothing but the `animate` default, its full prop surface is `@sanity/ui` `Popover`: ' +
            '`content`, `placement`, `fallbackPlacements`, `constrainSize`, `preventOverflow`, ' +
            '`portal`, and a child (or `referenceElement`) as the anchor.',
          '',
          'Current reproduces the empty flash, an open popover with no content. Recommended paints ' +
            'skeleton structure immediately so the surface never reads as blank.',
          '',
          '> **Why it matters:** a popover can open before its content is ready and flash an empty box ' +
            'for ~1s, the instant-gratification finding. Paint skeleton structure the instant it opens ' +
            'so the surface reads as content loading here, never as a blank void.',
          '',
          'The page closes *in context*: a document pane header for the book *Anna Karenina* whose ' +
            "toolbar button opens a Popover of the document's info, the anchored-panel pattern that " +
            'menus and info cards are all built on.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:nav',
    'pattern:hover-popup-tools',
    'pattern:instant-gratification',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof Popover>

const PopoverContent = (
  <Box padding={3} style={{maxWidth: 220}}>
    <Stack gap={3}>
      <Text size={1} weight="medium">
        Popover content
      </Text>
      <Text size={1} muted>
        The Studio shadow animates this in by default.
      </Text>
    </Stack>
  </Box>
)

// The content a real menu-style popover paints once its data is ready — used by the
// empty-flash / skeleton pair to show what swaps in after the ~1s load.
const RealMenuContent = (
  <Box padding={2} style={{width: 220}}>
    <Stack gap={1}>
      {['Rename', 'Duplicate', 'Delete'].map((label) => (
        <Box key={label} padding={2}>
          <Text size={1}>{label}</Text>
        </Box>
      ))}
    </Stack>
  </Box>
)

/**
 * The raw `@sanity/ui` primitive vs the Studio shadow. Functionally identical
 * here; the shadow's only behavioural difference is `animate` defaulting on.
 * Click the trigger to open/close the popover.
 */
export const Primitive: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Flex gap={5} align="center" justify="center" style={{minHeight: 160}}>
          <UIPopover content={PopoverContent} open={open} placement="bottom" portal>
            <UIButton
              text="@sanity/ui Popover"
              selected={open}
              onClick={() => setOpen((v) => !v)}
            />
          </UIPopover>
        </Flex>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * The Studio `Popover`, animated. Click the trigger to open/close.
 */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Flex align="center" justify="center" style={{minHeight: 160}}>
          <Popover content={PopoverContent} open={open} placement="bottom" portal>
            <UIButton
              text="Studio Popover"
              tone="primary"
              selected={open}
              onClick={() => setOpen((v) => !v)}
            />
          </Popover>
        </Flex>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * The four primary placements. Click any anchor to toggle its own popover open;
 * generous spacing keeps them from overlapping when several are open.
 */
export const Placements: Story = {
  render: () => {
    const short = (
      <Box padding={3}>
        <Text size={1}>Placement</Text>
      </Box>
    )
    function PlacementCell({placement}: {placement: 'top' | 'right' | 'bottom' | 'left'}) {
      const [open, setOpen] = useState(false)
      return (
        <Flex justify="center" paddingY={4}>
          <Popover content={short} open={open} placement={placement} portal>
            <UIButton
              mode="ghost"
              text={placement}
              selected={open}
              onClick={() => setOpen((v) => !v)}
            />
          </Popover>
        </Flex>
      )
    }
    return (
      <OverlayFrame minHeight={360}>
        <Grid gridTemplateColumns={2} gap={6} paddingY={5} paddingX={4}>
          {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
            <PlacementCell key={placement} placement={placement} />
          ))}
        </Grid>
      </OverlayFrame>
    )
  },
}

/**
 * Current, the audit finding: `instant-gratification`. The audit found popovers
 * that open before their content is ready, flashing an empty box. Click Open
 * menu: the popover opens immediately but its content stays blank for ~1s
 * before painting, so you experience the empty flash the audit describes.
 */
export const Current: Story = {
  name: 'Current (empty flash)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      const [ready, setReady] = useState(false)
      // Opening starts a ~1s load; until it resolves the content region is blank —
      // the empty flash. Resetting `ready` in the toggle (not the effect) keeps the
      // effect free of synchronous setState, so each open re-runs the flash.
      const handleToggle = () => {
        setReady(false)
        setOpen((v) => !v)
      }
      useEffect(() => {
        if (!open) return undefined
        const id = setTimeout(() => setReady(true), 1000)
        return () => clearTimeout(id)
      }, [open])
      return (
        <Flex align="center" justify="center" style={{minHeight: 160}}>
          <Popover
            content={ready ? RealMenuContent : <Box padding={3} style={{width: 220, height: 96}} />}
            open={open}
            placement="bottom"
            portal
          >
            <UIButton text="Open menu" selected={open} onClick={handleToggle} />
          </Popover>
        </Flex>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * Recommended: same ~1s load, but the popover paints skeleton rows the instant
 * it opens, so the surface reads as "content loading here" rather than an empty box.
 * Click Open menu: the skeleton bridges the gap, then real content swaps in.
 */
export const Recommended: Story = {
  name: 'Recommended (skeleton content)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    const skeletonBar = (width: string) => (
      <Card
        radius={2}
        tone="transparent"
        style={{background: 'var(--card-muted-fg-color)', opacity: 0.15, height: 12, width}}
      />
    )
    const skeleton = (
      <Box padding={3} style={{width: 220}}>
        <Stack gap={3}>
          {skeletonBar('80%')}
          {skeletonBar('60%')}
          {skeletonBar('70%')}
        </Stack>
      </Box>
    )
    function Demo() {
      const [open, setOpen] = useState(false)
      const [ready, setReady] = useState(false)
      const handleToggle = () => {
        setReady(false)
        setOpen((v) => !v)
      }
      useEffect(() => {
        if (!open) return undefined
        const id = setTimeout(() => setReady(true), 1000)
        return () => clearTimeout(id)
      }, [open])
      return (
        <Flex align="center" justify="center" style={{minHeight: 160}}>
          <Popover
            content={ready ? RealMenuContent : skeleton}
            open={open}
            placement="bottom"
            portal
          >
            <UIButton text="Open menu" tone="primary" selected={open} onClick={handleToggle} />
          </Popover>
        </Flex>
      )
    }
    return (
      <OverlayFrame minHeight={220}>
        <Demo />
      </OverlayFrame>
    )
  },
}

/**
 * In context, the document header info popover. A document pane header for the book
 * *Anna Karenina* with a toolbar button on the right; click Details and the Studio Popover
 * floats the document's info beside it, type, status, and when it last changed, the same
 * anchored-panel pattern that Studio's menus, hover cards and inline pickers all sit on. Click
 * the button again to dismiss it.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const info = (
      <Box padding={3} style={{width: 240}}>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            Document info
          </Text>
          <Stack gap={3}>
            {[
              ['Type', 'Book'],
              ['Status', 'Draft, not published'],
              ['Last edited', '1 March 2026'],
            ].map(([label, value]) => (
              <Flex key={label} justify="space-between" gap={3}>
                <Text size={1} muted>
                  {label}
                </Text>
                <Text size={1}>{value}</Text>
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Box>
    )
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Card radius={2} shadow={1} style={{width: 420}}>
          <Flex align="center" gap={3} padding={2}>
            <Box flex={1} paddingLeft={1}>
              <Text size={1} weight="medium">
                Anna Karenina
              </Text>
              <Box paddingTop={1}>
                <Text size={0} muted>
                  Book · Draft
                </Text>
              </Box>
            </Box>
            <Popover content={info} open={open} placement="bottom-end" portal>
              <UIButton
                mode="bleed"
                text="Details"
                selected={open}
                onClick={() => setOpen((v) => !v)}
              />
            </Popover>
          </Flex>
        </Card>
      )
    }
    return (
      <OverlayFrame minHeight={280}>
        <Demo />
      </OverlayFrame>
    )
  },
}
