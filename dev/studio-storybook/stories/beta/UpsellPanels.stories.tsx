import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Container, Flex, LayerProvider, Stack, Text, ToastProvider} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real Studio components from their real paths (org contract §8). The upsell family is
// Studio-only and not surfaced through the `sanity` exports map.
import {CommentsUpsellPanel} from '../../../../packages/sanity/src/core/comments/components/upsell/CommentsUpsellPanel'
import {
  FreeTrialButtonSidebar,
  FreeTrialButtonTopbar,
} from '../../../../packages/sanity/src/core/studio/components/navbar/free-trial/FreeTrialButton'
import {PopoverContent as FreeTrialPopoverContent} from '../../../../packages/sanity/src/core/studio/components/navbar/free-trial/PopoverContent'
import {type FreeTrialDialog} from '../../../../packages/sanity/src/core/studio/components/navbar/free-trial/types'
import {type UpsellData} from '../../../../packages/sanity/src/core/studio/upsell/types'
import {UpsellDialog} from '../../../../packages/sanity/src/core/studio/upsell/UpsellDialog'
import {UpsellPanel} from '../../../../packages/sanity/src/core/studio/upsell/UpsellPanel'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'

// A 1x1-ish gradient banner as a data URI so the panel's hero image renders fully offline
// (the real `UpsellData.image.asset.url` points at a Sanity CDN asset).
const HERO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#7c4dff"/><stop offset="1" stop-color="#1f6feb"/>
       </linearGradient></defs>
       <rect width="600" height="240" fill="url(#g)"/>
       <text x="50%" y="130" text-anchor="middle" fill="white" font-family="Inter, sans-serif" font-size="28" font-weight="700">Upgrade</text>
     </svg>`,
  )

// The Portable-Text description the upsell serializer renders: a heading, a paragraph with
// inline emphasis, a benefit bullet list, and one `iconAndText` row (a Studio-authored
// custom block). `sanityIcon` is used rather than a remote icon `url` so nothing fetches.
const descriptionText: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'h',
    style: 'h2',
    markDefs: [],
    children: [{_type: 'span', _key: 'h0', text: 'Unlock Comments', marks: []}],
  },
  {
    _type: 'block',
    _key: 'p',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'p0', text: 'Discuss changes right on the document. ', marks: []},
      {_type: 'span', _key: 'p1', text: 'Available on Growth', marks: ['accent']},
      {_type: 'span', _key: 'p2', text: ' and above.', marks: []},
    ],
  },
  {
    _type: 'block',
    _key: 'li1',
    style: 'normal',
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    children: [{_type: 'span', _key: 'li1-0', text: 'Threaded, resolvable comments', marks: []}],
  },
  {
    _type: 'block',
    _key: 'li2',
    style: 'normal',
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'li2-0', text: 'Field-level mentions and notifications', marks: []},
    ],
  },
  // A Studio-authored custom PT block (`PortableTextObject` — extra keys are read by the
  // serializer's `iconAndText` renderer). `sanityIcon` avoids a remote icon fetch.
  {
    _type: 'iconAndText',
    _key: 'iat',
    sanityIcon: 'bolt',
    accent: true,
    title: 'No setup',
    text: 'Turn it on for the whole workspace in one place.',
  },
]

const upsellData: UpsellData = {
  _createdAt: '2026-07-01T00:00:00.000Z',
  _id: 'upsell-comments',
  _rev: 'rev',
  _type: 'upsell',
  _updatedAt: '2026-07-01T00:00:00.000Z',
  id: 'comments',
  image: {asset: {url: HERO_IMAGE, altText: 'Upgrade to unlock comments'}},
  descriptionText,
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/pricing'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

// The free-trial popover reuses the same serializer with a `FreeTrialDialog` shape.
const freeTrialDialog: FreeTrialDialog = {
  _id: 'trial-popover',
  _type: 'dialog',
  _createdAt: '2026-07-01T00:00:00.000Z',
  _updatedAt: '2026-07-01T00:00:00.000Z',
  _rev: 'rev',
  id: 'trial',
  dialogType: 'popover',
  headingText: '14 days left in your trial',
  image: {asset: {url: HERO_IMAGE, altText: 'Free trial'}},
  descriptionText: [
    {
      _type: 'block',
      _key: 'p',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'p0',
          text: 'You are on the Growth trial. Add a plan to keep releases, comments and tasks after it ends.',
          marks: [],
        },
      ],
    },
  ],
  ctaButton: {text: 'Choose a plan', action: 'openUrl', url: 'https://www.sanity.io/pricing'},
  secondaryButton: {text: 'Dismiss'},
}

const meta: Meta = {
  title: 'Laws & Behaviors/Upsell',
  // Placed under Laws & Behaviors (not CMS Patterns): these are monetization chrome — a
  // cross-cutting attention/conversion layer, not a content-lifecycle pattern. The panel
  // is the same primitive whichever feature is gated; only the fixture data differs.
  decorators: [
    (Story) => (
      <ToastProvider>
        <LayerProvider>
          <Story />
        </LayerProvider>
      </ToastProvider>
    ),
  ],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          "UpsellPanel is Studio's single, honest answer to selling inside a working tool: one " +
            'presentational primitive every feature reuses, so the pitch stays consistent and the ' +
            'exits stay real.',
          '',
          '|          |                                                                                                                                                                                                                                                                                             |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/studio/upsell/*` + `.../navbar/free-trial/*`, Studio-only (no design-system equivalent)                                                                                                                                                                           |',
          '| Flag     | plan-gated (commercial limits / usage caps, no config boolean). The panel appears when a feature is unavailable on the current plan or a usage limit is hit; the free-trial button appears during an active trial                                                                           |',
          '| Tier     | CHROME. A conversion/attention layer. `UpsellPanel` is one presentational primitive (hero image + Portable-Text pitch + CTA/secondary buttons); each feature (comments, tasks, releases, document limits) wraps it with its own fixture and telemetry. Nothing here reads or writes content |',
          '| Audit    | ⚪ not-audited. Upsell surfaces were outside the authoring-focused pass. The law they must honour is `interruption-cost` / honest affordance: the CTA is a real link to pricing and the secondary action is a non-blocking dismiss/learn-more, never a dark-pattern trap                    |',
          '| Patterns | `upsell`                                                                                                                                                                                                                                                                                    |',
          '',
          'Build a new gated feature and you compose this, not a bespoke paywall. The panel is ' +
            'fully prop-driven off a single `UpsellData` fixture and renders offline. ' +
            '`CommentsUpsellPanel` shows the one-line wrapper each feature adds (a width ' +
            '`Container` plus spacing); Tasks, Releases and Document-limits panels are the same ' +
            '`UpsellPanel` behind their own runtime contexts, so they are represented by the ' +
            'shared primitive here rather than re-mocking each provider. The free-trial pieces ' +
            'are the navbar entry points: the bolt button with a countdown ring, and the popover ' +
            'it opens.',
          '',
          '> **Why it matters:** the honest-affordance rule is non-negotiable: the CTA must be ' +
            'a real link to pricing and the secondary action must be a genuine, non-blocking ' +
            'dismiss or learn-more. An upsell that traps the editor is a bug, not a conversion ' +
            'win.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:behaviors',
    'pattern:upsell',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
    'flag:plan-gated',
  ],
}

export default meta
type Story = StoryObj

/**
 * The generic `UpsellPanel` in its default vertical layout: hero image on top, the
 * serialized pitch, then the secondary + CTA buttons right-aligned. This is the shape
 * every feature-specific panel renders.
 */
export const Panel_Vertical: Story = {
  name: 'Panel (vertical)',
  render: () => (
    <Container width={1}>
      <UpsellPanel data={upsellData} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />
    </Container>
  ),
}

/**
 * The horizontal layout used in wider surfaces: at the third breakpoint the image moves
 * beside the text (50/50). Below that it falls back to the vertical stack, resize the
 * canvas to see the switch.
 */
export const Panel_Horizontal: Story = {
  name: 'Panel (horizontal)',
  render: () => (
    <Container width={2}>
      <UpsellPanel
        data={upsellData}
        layout="horizontal"
        onPrimaryClick={() => {}}
        onSecondaryClick={() => {}}
      />
    </Container>
  ),
}

/**
 * The centered, border-less variant used inside empty-state illustrations (e.g. the
 * Releases overview upsell drops the hero image and centers the pitch under a drawn
 * illustration). Driven by `align="center"`, `border={false}` and `image: null`.
 */
export const Panel_CenteredBorderless: Story = {
  name: 'Panel (centered, borderless)',
  render: () => (
    <Container width={1}>
      <UpsellPanel
        data={{...upsellData, image: null}}
        align="center"
        border={false}
        onPrimaryClick={() => {}}
        onSecondaryClick={() => {}}
      />
    </Container>
  ),
}

/**
 * `CommentsUpsellPanel` is the feature wrapper. It is a thin `Container width={1}` plus bottom
 * margin around the same `UpsellPanel`; the Tasks / Document-limits / Releases wrappers are
 * structurally identical, differing only in the fixture and telemetry they inject.
 */
export const FeaturePanel_Comments: Story = {
  name: 'Feature wrapper (Comments)',
  render: () => (
    <CommentsUpsellPanel data={upsellData} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />
  ),
}

/**
 * The free-trial navbar button in both placements: the top-bar bolt with a circular
 * days-left progress ring (fills as the trial elapses), and the wider sidebar/user-menu
 * variant with a text label. Tooltip copy is the real translated string.
 */
export const FreeTrial_Buttons: Story = {
  name: 'Free-trial buttons',
  render: () => (
    <Flex gap={4} align="center" padding={4}>
      <Stack gap={3}>
        <Text size={0} muted>
          Top bar
        </Text>
        <FreeTrialButtonTopbar daysLeft={5} totalDays={14} toggleShowContent={() => {}} />
      </Stack>
      <Box style={{minWidth: 220}}>
        <Stack gap={3}>
          <Text size={0} muted>
            Sidebar / user menu
          </Text>
          <FreeTrialButtonSidebar daysLeft={5} toggleShowContent={() => {}} />
        </Stack>
      </Box>
    </Flex>
  ),
}

/**
 * The popover the free-trial button opens: a hero image, heading, serialized description,
 * and a primary "choose a plan" link plus a dismiss. Prop-driven from a `FreeTrialDialog`.
 */
export const FreeTrial_Popover: Story = {
  name: 'Free-trial popover',
  render: () => (
    <Container width={0}>
      <FreeTrialPopoverContent
        content={freeTrialDialog}
        handleClose={() => {}}
        handleOpenNext={() => {}}
      />
    </Container>
  ),
}

/**
 * `UpsellDialog` is the modal sibling of the panel above: same `UpsellData`, same CTA pair,
 * different moment. A panel sits alongside a feature you can see but not use; the dialog
 * interrupts an action you just tried to take.
 */
export const Dialog_Default: StoryObj = {
  name: 'UpsellDialog',
  parameters: {
    docs: {
      description: {
        story:
          'The interrupting form. Both variants render the identical `UpsellData` - hero image, Portable Text pitch, primary and secondary buttons - so a feature team writes the content once and chooses the moment separately.\n\nThe interesting decision is that the dialog returns `null` unless BOTH `data` and `open` are truthy. A missing upsell document is not an error state and not an empty modal; it simply does not appear. That is the right failure for content fetched from a remote dataset the studio does not control - if the pitch cannot be loaded, the user should not learn that a pitch exists.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <UpsellDialog
        data={upsellData}
        onClose={() => undefined}
        onPrimaryClick={() => undefined}
        onSecondaryClick={() => undefined}
      />
    ),
}

export const Dialog_NoData: StoryObj = {
  name: 'UpsellDialog - no data, renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          'With `data: null` the dialog renders nothing at all. Storied explicitly because it is the state a failed or slow fetch of the upsell document produces, and silence is the correct outcome - an empty modal frame would be worse than no modal.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 480}}>
      <Stack gap={3}>
        <UpsellDialog
          data={null}
          onClose={() => undefined}
          onPrimaryClick={() => undefined}
          onSecondaryClick={() => undefined}
        />
        <Text size={0} muted>
          the dashed box is the story frame; the dialog itself rendered nothing
        </Text>
      </Stack>
    </Card>
  ),
}
