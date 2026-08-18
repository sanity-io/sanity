import {type SanityDocument} from '@sanity/types'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type FormNodePresence} from '../../../../presence/types'
import {PresenceCursorsStory} from './PresenceCursorsStory'

const TEXT = 'Hello, this is some text in the editor.'

// Mirrors the fixture in PresenceCursors.browser.test.tsx. The timestamps are
// document metadata and presence heartbeats; neither is rendered, so they do
// not affect the snapshot.
const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'a',
      children: [{_type: 'span', _key: 'a1', text: TEXT}],
      markDefs: [],
    },
  ],
}

const offset1 = TEXT.indexOf('this is')
const offset2 = TEXT.indexOf('some text')

const PRESENCE: FormNodePresence[] = [
  {
    path: ['body', 'text'],
    lastActiveAt: new Date().toISOString(),
    sessionId: 'session-A',
    selection: {
      anchor: {offset: offset1, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      focus: {offset: offset1, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      backward: false,
    },
    user: {
      id: 'user-A',
      displayName: 'User A',
    },
  },
  {
    path: ['body', 'text'],
    lastActiveAt: new Date().toISOString(),
    sessionId: 'session-B',
    selection: {
      anchor: {offset: offset2, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      focus: {offset: offset2, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      backward: false,
    },
    user: {
      id: 'user-B',
      displayName: 'User B',
    },
  },
]

/**
 * Reuses the `PresenceCursors.browser.test.tsx` harness: a Portable Text
 * input rendering remote presence cursors for two users.
 */
const meta = {
  title: 'Portable Text/Presence Cursors',
  component: PresenceCursorsStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof PresenceCursorsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    document: DOCUMENT,
    presence: PRESENCE,
  },
}
