import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real component from its real path (org contract §8): the shared time-zone picker
// dialog used by scheduled publishing, content releases and timezone-aware inputs.
import DialogTimeZone from '../../../../packages/sanity/src/core/components/timeZone/DialogTimeZone'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Opens the real `DialogTimeZone` against the `scheduledPublishing` scope. The dialog
 * lists every IANA zone (from `Intl.supportedValuesOf('timeZone')`) ordered by offset,
 * with a searchable autocomplete, a "select local time zone" shortcut, and a scope
 * description line at the top. Selecting a zone and confirming persists it to the
 * key-value store for that scope, here backed by the mock client, so the write is inert.
 */
function DialogTimeZoneDemo() {
  const [open, setOpen] = useState(true)
  return (
    <Flex align="center" justify="center" padding={4} style={{minHeight: 360}}>
      {open ? (
        <DialogTimeZone
          timeZoneScope={{type: 'scheduledPublishing'}}
          onClose={() => setOpen(false)}
        />
      ) : (
        <Card padding={2}>
          <Button text="Open time zone dialog" onClick={() => setOpen(true)} />
        </Card>
      )}
    </Flex>
  )
}

const meta: Meta = {
  title: 'Scheduling/Time Zone Dialog',
  parameters: {
    docs: {
      description: {
        component: [
          'DialogTimeZone names the time zone a scheduled publish is interpreted in, rather ' +
            'than leaving it a silent assumption.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/timeZone/DialogTimeZone.tsx`, Studio-only (no DS equivalent) |',
          '| Tier | SERVICE. A scope-parameterised time-zone picker (`scheduledPublishing` / `contentReleases` / `input`) built on the DS `Dialog` and `@sanity/ui` `Autocomplete`, persisting the choice per-scope to the key-value store |',
          '| Audit | 🟢 holds (timezone legibility). This dialog is the resolution to the time-zone legibility gap the audit flagged on datetime entry; it is the affordance the Schedule Form field opens |',
          '| Patterns | `content-versioning` |',
          '',
          'It lists every IANA zone ordered by offset behind a searchable autocomplete, offers ' +
            'a one-click select-local-time-zone shortcut, and names the scope the choice applies ' +
            'to in a line at the top, so the interpreting zone is always explicit and selectable. ' +
            'The story mounts the real dialog on the studio provider stack ' +
            '(`lib/testProvider.tsx`). The zone list is computed from the runtime `Intl` ' +
            'database, so the exact rows reflect the environment; selection is persisted through ' +
            'the mock client and therefore inert here.',
          '',
          '> **Why it matters:** the chosen zone is persisted per scope, scheduled publishing, ' +
            'content releases, input, not globally. Setting it for scheduled publishing does not ' +
            'move it for releases. Each surface remembers its own interpreting zone on purpose.',
          '',
          'The last story shows the picker in context: opened for the content releases scope ' +
            'while scheduling the "Spring campaign" release, naming where "publish at 9am" means.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders()],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:overlays',
    'pattern:content-versioning',
    'audit:holds',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The time-zone picker, open. The dialog portals to the document root, so the story
 * renders in its own iframe (`inline: false`) where the portal is bounded to the frame.
 */
export const Default: Story = {
  name: 'Time zone picker',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => <DialogTimeZoneDemo />,
}

/**
 * **In context.** Scheduling the **Spring campaign** release, at the moment the obvious
 * question lands: publish "at 9am", but *where*? This is the same picker, opened for the
 * `contentReleases` scope (behind it, the release panel it belongs to), so the info line
 * names releases rather than scheduled publishing and the zone it remembers is the one
 * releases read. Search a zone or take the one-click "select local time zone" shortcut;
 * because the choice persists **per scope**, it won't disturb the zone the scheduled
 * publishing surface uses.
 */
export const InContext: Story = {
  name: 'In context (Spring campaign release)',
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '560px'}}},
  render: () => (
    <Box padding={4} style={{minHeight: 460}}>
      <Card border padding={4} radius={3}>
        <Stack gap={3}>
          <Text muted size={1}>
            Content release
          </Text>
          <Text size={2} weight="semibold">
            Spring campaign
          </Text>
          <Text muted size={1}>
            Scheduled to publish in 2 days, at 9:00am, in which time zone?
          </Text>
        </Stack>
      </Card>
      <DialogTimeZone timeZoneScope={{type: 'contentReleases'}} onClose={() => undefined} />
    </Box>
  ),
}
