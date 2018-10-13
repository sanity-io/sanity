# @sanity/diff-patch

Generates a patch of operations needed to change an item from shape to another.

## Getting started

    npm install --save @sanity/diff-patch

## Usage

```js
import diffPatch from '@sanity/diff-patch'

const patch = diffPatch(itemA, itemB)
/*
[
  {patch: {id: 'docId', set: {...}}},
  {patch: {id: 'docId', unset: [...]}},
  {patch: {id: 'docId', insert: {...}}}
]
*/
```

## Example usage

```js
import diffPatch from '@sanity/diff-patch'
import sanityClient from './myConfiguredSanityClient'

const itemA = {
  _id: 'die-hard-iii',
  _type: 'movie',
  name: 'Die Hard 3',
  year: 1995,
  characters: [
    {
      _key: 'ma4sg31',
      name: 'John McClane'
    },
    {
      _key: 'l13ma92',
      name: 'Simon Gruber'
    }
  ]
}

const itemB = {
  _id: 'drafts.die-hard-iii',
  _type: 'movie',
  name: 'Die Hard with a Vengeance',
  characters: [
    {
      _key: 'ma4sg31',
      name: 'John McClane'
    },
    {
      _key: 'l13ma92',
      name: 'Simon Grüber'
    }
  ]
}

// Specify id if the two documents do not match
const operations = diffPatch(itemA, itemB, {id: itemA._id})
await sanityClient.transaction(operations).commit()

// Patches generated:
const generatedPatches = [
  {
    patch: {
      id: 'die-hard-iii',
      set: {
        'name': 'Die Hard with a Vengeance',
        'characters[_key=="l13ma92"].name': 'Simon Grüber'
      },
    }
  },
  {
    patch: {
      id: 'die-hard-iii',
      unset: ['year']
    }
  }
}
```

## Needs improvement

- Improve patch on array item move
- Improve patch on array item delete
