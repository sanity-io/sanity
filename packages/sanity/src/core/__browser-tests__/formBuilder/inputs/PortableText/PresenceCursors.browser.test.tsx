import {describe, expect, it} from 'vitest'
import {page} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {type SanityDocument} from '@sanity/client'
import {type FormNodePresence} from 'sanity'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {PresenceCursorsStory} from './PresenceCursorsStory'

const TEXT = 'Hello, this is some text in the editor.'

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

function getSiblingTextContent() {
  const cursorA = document.querySelector('[data-testid="presence-cursor-User-A"]')
  const cursorB = document.querySelector('[data-testid="presence-cursor-User-B"]')

  return {
    cursorA: cursorA?.nextElementSibling?.nextElementSibling?.textContent,
    cursorB: cursorB?.nextElementSibling?.nextElementSibling?.textContent,
  }
}

describe('Portable Text Input', () => {
  describe('Presence Cursors', () => {
    it('should keep position when inserting text in the editor', async () => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()

      render(<PresenceCursorsStory document={DOCUMENT} presence={PRESENCE} />)

      const editor$ = await getFocusedPortableTextEditor('field-body')
      const $cursorA = page.getByTestId('presence-cursor-User-A')
      const $cursorB = page.getByTestId('presence-cursor-User-B')

      await expect.element($cursorA).toBeVisible()
      await expect.element($cursorB).toBeVisible()

      const siblingContentA = getSiblingTextContent()
      expect(siblingContentA.cursorA).toBe('this is ')
      expect(siblingContentA.cursorB).toBe('some text in the editor.')

      await insertPortableText('INSERTED TEXT. ', editor$)

      // Make sure that the cursors keep their position after inserting text
      const siblingContentB = getSiblingTextContent()
      expect(siblingContentB.cursorA).toBe('this is ')
      expect(siblingContentB.cursorB).toBe('some text in the editor.')
    })

    it.skip('should keep position when deleting text in the editor', async () => {
      // todo
    })

    it.skip('should keep position when pasting text i the editor', async () => {
      // todo
    })

    it.skip('should change position when updating the selection in the editor', async () => {
      // todo
    })
  })
})
