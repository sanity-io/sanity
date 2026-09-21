import {defineField, defineType, type SanityDocument} from '@sanity/types'

import {TestForm} from '../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type FormNodePresence} from '../../types'

// Enough fields that the form overflows the bounded scroll container below.
const FILLER_FIELD_COUNT = 20

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      ...Array.from({length: FILLER_FIELD_COUNT}, (_unused, index) =>
        defineField({type: 'string', name: `filler${index}`, title: `Filler ${index}`}),
      ),
    ],
  }),
]

export const SCROLLPORT_HEIGHT = 400

export const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2026-09-16T00:00:00.000Z',
  _updatedAt: '2026-09-16T00:00:00.000Z',
  _rev: '123',
  title: 'A title',
}

export function presenceOn(path: string, userIds: string[]): FormNodePresence[] {
  return userIds.map((id) => ({
    path: [path],
    lastActiveAt: '2026-09-16T00:00:00.000Z',
    sessionId: `session-${id}`,
    user: {id, displayName: `User ${id}`},
  }))
}

interface PresenceOverlayStoryProps {
  presence?: FormNodePresence[]
}

export function PresenceOverlayStory(props: PresenceOverlayStoryProps) {
  const {presence = presenceOn('title', ['a'])} = props

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm
        withPresenceOverlay
        height={SCROLLPORT_HEIGHT}
        document={DOCUMENT}
        presence={presence}
      />
    </TestWrapper>
  )
}
