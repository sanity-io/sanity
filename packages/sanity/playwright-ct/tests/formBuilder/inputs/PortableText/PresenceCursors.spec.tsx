import {expect, test} from '@playwright/experimental-ct-react'
import {type Page} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'
import {type FormNodePresence} from 'sanity'

import {testHelpers} from '../../../utils/testHelpers'
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

async function getSiblingTextContent(page: Page) {
  return await page.evaluate(() => {
    const cursorA = document.querySelector('[data-testid="presence-cursor-User-A"]')
    const cursorB = document.querySelector('[data-testid="presence-cursor-User-B"]')

    return {
      cursorA: cursorA?.nextElementSibling?.nextElementSibling?.textContent,
      cursorB: cursorB?.nextElementSibling?.nextElementSibling?.textContent,
    }
  })
}

test.describe('Portable Text Input', () => {
  test.describe('Presence Cursors', () => {
    test('should keep position when inserting text in the editor', async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({page})

      await mount(<PresenceCursorsStory document={DOCUMENT} presence={PRESENCE} />)

      const editor$ = await getFocusedPortableTextEditor('field-body')
      const $cursorA = editor$.getByTestId('presence-cursor-User-A')
      const $cursorB = editor$.getByTestId('presence-cursor-User-B')

      await expect($cursorA).toBeVisible()
      await expect($cursorB).toBeVisible()

      const siblingContentA = await getSiblingTextContent(page)
      expect(siblingContentA.cursorA).toBe('this is ')
      expect(siblingContentA.cursorB).toBe('some text in the editor.')

      await insertPortableText('INSERTED TEXT. ', editor$)

      // Make sure that the cursors keep their position after inserting text
      const siblingContentB = await getSiblingTextContent(page)
      expect(siblingContentB.cursorA).toBe('this is ')
      expect(siblingContentB.cursorB).toBe('some text in the editor.')
    })

    test.skip('should keep position when deleting text in the editor', async () => {
      // todo
    })

    test.skip('should keep position when pasting text i the editor', async () => {
      // todo
    })

    test.skip('should change position when updating the selection in the editor', async () => {
      // todo
    })
  })
})
