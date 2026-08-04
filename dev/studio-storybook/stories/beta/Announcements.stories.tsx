import {type PortableTextBlock} from '@sanity/types'
import {Button, Card, Flex, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
// The announcements context lives in the singletons barrel; seeding it is the only way
// `StudioAnnouncementsMenuItem` renders (it returns `null` when the context is empty).
import {StudioAnnouncementContext} from 'sanity/_singletons'

// Real Studio components from their real paths (org contract §8) — the `studioAnnouncements`
// set is Studio-only and not surfaced through the `sanity` exports map.
import {StudioAnnouncementsCard} from '../../../../packages/sanity/src/core/studio/studioAnnouncements/StudioAnnouncementsCard'
import {StudioAnnouncementsDialog} from '../../../../packages/sanity/src/core/studio/studioAnnouncements/StudioAnnouncementsDialog'
import {StudioAnnouncementsMenuItem} from '../../../../packages/sanity/src/core/studio/studioAnnouncements/StudioAnnouncementsMenuItem'
import {
  type StudioAnnouncementDocument,
  type StudioAnnouncementsContextValue,
} from '../../../../packages/sanity/src/core/studio/studioAnnouncements/types'
import {WithStudioProviders} from '../../lib/testProvider'
// The dialog portals to `document.body` by default (see `Dialog_WhatsNew` below), which
// escapes the docs canvas entirely. `OverlayFrame` is the org-standard containment harness
// (already used across stories/overlays/*.stories.tsx): it supplies a local `<PortalProvider>`
// target inside a themed, relatively-positioned `<Card>`, so the portal renders in-frame.
import {OverlayFrame} from '../overlays/OverlayFrame'

// A Portable-Text body for one announcement. The dialog serializes it through the shared
// `UpsellDescriptionSerializer`, so this exercises the real block renderer (heading + copy
// + bullet list) exactly as a published `productAnnouncement` document would.
const announcementBody = (headline: string): PortableTextBlock[] => [
  {
    _type: 'block',
    _key: 'h',
    style: 'h3',
    markDefs: [],
    children: [{_type: 'span', _key: 'h0', text: headline, marks: []}],
  },
  {
    _type: 'block',
    _key: 'p',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'p0',
        text: 'A short summary of what shipped, written for editors rather than release notes. ',
        marks: [],
      },
      {_type: 'span', _key: 'p1', text: 'The important part', marks: ['semibold']},
      {_type: 'span', _key: 'p2', text: ' is called out inline.', marks: []},
    ],
  },
  {
    _type: 'block',
    _key: 'li1',
    style: 'normal',
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'li1-0', text: 'One concrete thing you can now do', marks: []},
    ],
  },
  {
    _type: 'block',
    _key: 'li2',
    style: 'normal',
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'li2-0', text: 'A second, with a link to the docs', marks: []},
    ],
  },
]

// A fully-formed `productAnnouncement` document. Only the fields the UI actually reads are
// meaningful; the rest satisfy the type. `publishedDate` drives the dialog's sticky date
// header (formatted via `useDateTimeFormat`, hence the LocaleProvider from the harness).
const makeAnnouncement = (
  overrides: Partial<StudioAnnouncementDocument> &
    Pick<StudioAnnouncementDocument, '_id' | 'title'>,
): StudioAnnouncementDocument => ({
  _type: 'productAnnouncement',
  _rev: 'rev',
  _createdAt: '2026-07-01T00:00:00.000Z',
  _updatedAt: '2026-07-01T00:00:00.000Z',
  name: overrides._id,
  announcementType: 'whats-new',
  publishedDate: '2026-07-14T00:00:00.000Z',
  audience: 'everyone',
  preHeader: "What's new",
  body: announcementBody(overrides.title),
  ...overrides,
})

const announcements: StudioAnnouncementDocument[] = [
  makeAnnouncement({
    _id: 'a-releases',
    title: 'Content Releases are out of beta',
    preHeader: "What's new",
    publishedDate: '2026-07-14T00:00:00.000Z',
  }),
  makeAnnouncement({
    _id: 'a-canvas',
    title: 'Draft in Canvas, publish from Studio',
    preHeader: 'Also new',
    publishedDate: '2026-06-30T00:00:00.000Z',
  }),
]

const menuContextValue: StudioAnnouncementsContextValue = {
  studioAnnouncements: announcements,
  unseenAnnouncements: announcements,
  onDialogOpen: () => {},
}

const meta: Meta = {
  title: 'Laws & Behaviors/Announcements',
  // Placed under Laws & Behaviors (not CMS Patterns): the "What's new" set is cross-cutting
  // attention chrome — a monetization-adjacent notification surface that sits on top of any
  // workspace — not a content-lifecycle pattern. It reads no document and owns no data.
  decorators: [WithStudioProviders()],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Announcements is how Studio reaches editors without sending an email: a floating ' +
            'teaser, a full reader, and a Help-menu entry that surface a shipped feature to the ' +
            'people already at work.',
          '',
          '|          |                                                                                                                                                                                                                     |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/studio/studioAnnouncements/*`, Studio-only (no design-system equivalent); the in-app "What\'s new" surface                                                                                 |',
          '| Flag     | `announcements.enabled` (`StudioAnnouncementsProvider`, `@internal @hidden`), off by default; the real Studio also gates on a fetched `productAnnouncement` feed                                                    |',
          '| Tier     | CHROME. A notification/attention layer painted over the studio shell. It fetches a feed and renders three self-contained pieces (floating card, dialog, help-menu entry); nothing here touches document content     |',
          "| Audit    | ⚪ not-audited. The pattern-library pass exercised the authoring surfaces, not this promotional chrome. Its relevant law is `interruption-cost`: a what's-new prompt must be dismissible and never block the editor |",
          '| Patterns | `whats-new`                                                                                                                                                                                                         |',
          '',
          'Rather than hoping editors read a changelog, the announcements surface meets them ' +
            'where they work, and because it is chrome painted over the shell, it has to earn ' +
            'that attention without ever getting between the editor and their document.',
          '',
          'The three pieces are prop-driven and render offline. `StudioAnnouncementsCard` is ' +
            'the bottom-left floating teaser; `StudioAnnouncementsDialog` is the full reader (one ' +
            'entry per unseen announcement, Portable-Text body via the shared upsell serializer, ' +
            'sticky date header); `StudioAnnouncementsMenuItem` is the Help-menu re-entry point. ' +
            'The provider that fetches the feed and tracks "seen" state is not mounted, fixtures ' +
            'stand in for its output.',
          '',
          '> **Why it matters:** this surface lives or dies by whether it can be dismissed. A ' +
            "what's-new prompt must always be closeable and must never block editing. The card's " +
            "bleed close button and the dialog's click-outside both honor that; if you extend " +
            'this surface, keep the escape hatch.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:behaviors',
    'pattern:whats-new',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
    'flag:announcements.enabled',
  ],
}

export default meta
type Story = StoryObj

/**
 * The floating "What's new" teaser. In Studio it is pinned to the bottom-left of the viewport
 * by a fixed-offset `Popover`. Hover reveals the bleed close button; the whole card is a button
 * that opens the full dialog.
 *
 * Two things this story has to supply that the component does not.
 *
 * `OverlayFrame` contains the card. A first attempt used the `transform: translateZ(0)`
 * containing-block device instead, and headless verification on the 2026-07-30 build proved it
 * cannot work here: the card's Popover PORTALS, so its DOM node lands as a SIBLING of any
 * wrapper this story renders (`wrapper.contains(popover)` measured false), and a transformed
 * ancestor only becomes the containing block for descendants along the DOM tree. The card kept
 * rendering at the exact pre-fix position (x=12, y=734 in an 800px viewport). `OverlayFrame`
 * works where the transform cannot because it changes where the portal LANDS: it supplies the
 * `PortalProvider` target inside its own relatively-positioned Card, the same mechanic verified
 * on the array insert menus tonight (predicted placement and heights confirmed to the pixel).
 *
 * And `onCardDismiss` is real state rather than a no-op. The meta for this group states that a
 * what's-new prompt must always be dismissible; a story wired to `() => {}` cannot demonstrate
 * that, and a close button that visibly does nothing argues the opposite of the claim above it.
 */
function FloatingCardDemo() {
  const [dismissed, setDismissed] = useState(false)
  return (
    <OverlayFrame>
      {dismissed ? (
        <Flex align="center" justify="center" style={{height: 180}}>
          <Stack gap={3}>
            <Text align="center" size={1} muted>
              Dismissed. The prompt does not come back on its own.
            </Text>
            <Button mode="ghost" text="Show it again" onClick={() => setDismissed(false)} />
          </Stack>
        </Flex>
      ) : (
        <StudioAnnouncementsCard
          id="a-releases"
          name="a-releases"
          title="Content Releases are out of beta"
          preHeader="What's new"
          isOpen
          onCardClick={() => {}}
          onCardDismiss={() => setDismissed(true)}
        />
      )}
    </OverlayFrame>
  )
}

export const Card_Floating: Story = {
  name: 'Floating card',
  parameters: {docs: {story: {height: '220px'}}},
  render: () => <FloatingCardDemo />,
}

/**
 * The full reader dialog, opened from either the card or the Help menu. Renders every
 * unseen announcement stacked with fading dividers, each with a sticky date/title header
 * and a Portable-Text body.
 *
 * `StudioAnnouncementsDialog` exposes no `position` or `portal` prop of its own; it always
 * renders `@sanity/ui`'s `Dialog` at its default `position: fixed`, portaled to
 * `document.body`. In autodocs, stories render inline in the same document as the docs
 * page, so a bare `position: fixed` element measures against the whole page viewport, not
 * this story's block: that is what previously made this dialog cover the "Floating card"
 * story above and the prose below it. Two containments fix that, both applied from the
 * story side since the component itself can't be touched: `OverlayFrame` (the org
 * contract's containment harness, also used across `stories/overlays/*.stories.tsx`) gives
 * the dialog a local `PortalProvider` target instead of `document.body`, and the
 * `transform` on the outer wrapper below establishes a new containing block for
 * fixed-position descendants (CSS Transforms spec), so `position: fixed` resolves against
 * this frame instead of the page. Together they keep the dialog inside its own preview,
 * matching the "docs canvas is sized to contain it" intent.
 */
export const Dialog_WhatsNew: Story = {
  name: 'Reader dialog',
  parameters: {docs: {story: {height: '640px'}}},
  render: () => (
    <div style={{position: 'relative', transform: 'translateZ(0)'}}>
      <OverlayFrame minHeight={600}>
        <StudioAnnouncementsDialog announcements={announcements} mode="card" onClose={() => {}} />
      </OverlayFrame>
    </div>
  ),
}

/**
 * The Help-menu re-entry point. It renders `null` unless the announcements context carries
 * at least one announcement, so this story seeds `StudioAnnouncementContext` with the
 * fixtures, the same context the real `StudioAnnouncementsProvider` supplies at runtime.
 */
export const MenuItem_HelpMenu: Story = {
  name: 'Help-menu item',
  render: () => (
    <StudioAnnouncementContext.Provider value={menuContextValue}>
      <Card radius={2} shadow={1} style={{maxWidth: 260}}>
        <Menu>
          <StudioAnnouncementsMenuItem text="What's new" />
        </Menu>
      </Card>
    </StudioAnnouncementContext.Provider>
  ),
}
