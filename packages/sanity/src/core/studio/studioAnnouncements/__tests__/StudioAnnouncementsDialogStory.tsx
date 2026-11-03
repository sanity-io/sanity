import {type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type RefObject} from 'react'
import {Box} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../i18n/components/LocaleProvider'
import {Divider} from '../Divider'
import {StudioAnnouncementsDialog} from '../StudioAnnouncementsDialog'
import {type StudioAnnouncementDocument} from '../types'

function paragraph(key: string, text: string): PortableTextBlock {
  return {
    _key: key,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: `${key}-span`, _type: 'span', text, marks: []}],
  }
}

const ANNOUNCEMENTS: StudioAnnouncementDocument[] = [
  {
    _id: 'studioAnnouncement-1',
    _type: 'productAnnouncement',
    _rev: 'rev-1',
    _createdAt: '2024-09-10T14:44:00.000Z',
    _updatedAt: '2024-09-10T14:44:00.000Z',
    title: 'Content Releases are now generally available',
    name: 'content-releases-ga',
    body: [
      paragraph(
        'b1',
        'Plan, preview and publish groups of documents together. Releases replace scheduled publishing for most teams.',
      ),
    ],
    announcementType: 'whats-new',
    preHeader: "What's new",
    publishedDate: '2024-09-10T14:44:00.000Z',
    audience: 'everyone',
  },
  {
    _id: 'studioAnnouncement-2',
    _type: 'productAnnouncement',
    _rev: 'rev-2',
    _createdAt: '2024-08-01T09:00:00.000Z',
    _updatedAt: '2024-08-01T09:00:00.000Z',
    title: 'A faster document pane',
    name: 'faster-document-pane',
    body: [paragraph('b2', 'Large documents now open noticeably faster.')],
    announcementType: 'whats-new',
    preHeader: "What's new",
    publishedDate: '2024-08-01T09:00:00.000Z',
    audience: 'everyone',
  },
]

const DETACHED_PARENT: RefObject<HTMLDivElement | null> = {current: null}

/**
 * Chromatic sentinel for the "What's new" announcements dialog: the sticky
 * per-announcement header (short date, title), the serialized body, the fading
 * divider between two announcements and the floating close button. A bare
 * `Divider` without a scroll parent sits behind the dialog. Both announcements
 * are fixtures with pinned 2024 dates; `useTelemetry` falls back to its no-op
 * logger. `TestWrapper` mounts no locale provider, so the studio
 * `LocaleProvider` sits on top of the mock source for the date formatter.
 */
export function StudioAnnouncementsDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Box padding={4} style={{width: 320}}>
          <Divider parentRef={DETACHED_PARENT} />
        </Box>
        <StudioAnnouncementsDialog announcements={ANNOUNCEMENTS} mode="help_menu" onClose={noop} />
      </LocaleProvider>
    </TestWrapper>
  )
}
