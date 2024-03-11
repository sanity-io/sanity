import {expect, test} from 'vitest'

import {at, createIfNotExists, patch} from '../../mutations/creators'
import {set, unset} from '../../mutations/operations/creators'
import {format} from '../compact'

test('format', () => {
  expect(
    format([
      createIfNotExists({_id: 'cat', _type: 'cat'}),
      patch('cat', [
        at('title', set('hello world')),
        at('breed.name', set('common house cat')),
        at('title', unset()),
        at('hello', unset()),
      ]),
      patch('cat', [at('breed', set('forest cat'))]),
      patch('other', [at('sound', set('meow'))], {ifRevision: 'rev004'}),
    ]),
  ).toMatchInlineSnapshot(`
    "createIfNotExists: {"_id":"cat","_type":"cat"}
    patch id=cat:
      title: set("hello world")
      breed.name: set("common house cat")
      title: unset()
      hello: unset()
    patch id=cat:
      breed: set("forest cat")
    patch id=other (if revision==rev004):
      sound: set("meow")"
  `)
})
